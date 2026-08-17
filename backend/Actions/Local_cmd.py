import platform
import subprocess
import os

system_commands = {
    "show files": {
        "Windows": "dir",
        "Linux": "ls"
    },

    "show hidden files": {
        "Windows": "dir /a",
        "Linux": "ls -la"
    },

    "current directory": {
        "Windows": "cd",
        "Linux": "pwd"
    },

    "sleep": {
        "Windows": "rundll32.exe powrprof.dll,SetSuspendState 0,1,0",
        "Linux": "systemctl suspend"
    },

    "lock": {
        "Windows": "rundll32.exe user32.dll,LockWorkStation",
        "Linux": "loginctl lock-session"
    },

    "restart": {
        "Windows": "shutdown /r /t 0",
        "Linux": "reboot"
    },

    "ip address": {
        "Windows": "ipconfig",
        "Linux": "ip addr"
    },

    "hostname": {
        "Windows": "hostname",
        "Linux": "hostname"
    },

    "system info": {
        "Windows": "systeminfo",
        "Linux": "uname -a"
    },
}

create_command = {
    "create folder": {
        "Windows": "mkdir",
        "Linux": "mkdir"
    },

    "create file": {
        "Windows": "type nul >",
        "Linux": "touch"
    },

    "copy file": {
        "Windows": "copy",
        "Linux": "cp"
    },

    "move file": {
        "Windows": "move",
        "Linux": "mv"
    },

    "rename file": {
        "Windows": "ren",
        "Linux": "mv"
    },
}

Application = {
    "calculator": {
        "Windows": "calc",
        "Linux": "gnome-calculator"
    },

    "open file manager": {
        "Windows": "explorer .",
        "Linux": "xdg-open ."
    },

    "notepad": {
        "Windows": "notepad",
        "Linux": "gedit"
    },

    "terminal": {
        "Windows": "start cmd",
        "Linux": "x-terminal-emulator"
    },

    "cmd": {
        "Windows": "start cmd",
        "Linux": "x-terminal-emulator"
    },

    "vs code": {
        "Windows": "code",
        "Linux": "code"
    },

    "task manager": {
        "Windows": "taskmgr",
        "Linux": "gnome-system-monitor"
    }
}

# For executing system commands
def system(action):
    sys_type = platform.system()

    if action not in system_commands:
        return "Unknown command"

    command = system_commands[action].get(sys_type)

    if not command:
        return f"{sys_type} is not supported"

    try:
        result = subprocess.run(command, check=True, timeout=60, shell=True, capture_output=True, text=True)
        return result.stdout.strip()

    except subprocess.CalledProcessError as e:
        return (e.stderr.strip() if e.stderr else str(e))

    except subprocess.TimeoutExpired as e:
        return "Command timed out after 60 seconds"

    except Exception as e:
        return f"Unexpected error: {e}"

# For creating files, folders, and multi-directory navigation with Deletion Protection
def create(action, name, target_dir=""):
    # Deletion Protection Shield
    if any(k in action.lower() or k in name.lower() for k in ["delete", "remove", "del", "rm", "unlink"]):
        return "Permission is not granted for deleting things in the system"

    sys_type = platform.system()

    if action not in create_command:
        return "Unknown command"

    command = create_command[action].get(sys_type)

    if not command:
        return f"{sys_type} is not supported"

    # Multi-directory handling (e.g. "create main.py in code folder")
    if target_dir and target_dir.strip():
        dir_path = target_dir.strip()
        if not os.path.exists(dir_path):
            try:
                os.makedirs(dir_path, exist_ok=True)
            except Exception:
                pass
        target_path = os.path.join(dir_path, name)
    else:
        target_path = name

    try:
        full_command = f'{command} "{target_path}"'
        result = subprocess.run(full_command, check=True, timeout=60, shell=True, capture_output=True, text=True)
        return result.stdout.strip() if result.stdout else f"{action} '{target_path}' created successfully."

    except subprocess.CalledProcessError as e:
        return (e.stderr.strip() if e.stderr else str(e))

    except subprocess.TimeoutExpired as e:
        return "Command timed out after 60 seconds"

    except Exception as e:
        return f"Unexpected error: {e}"

# For opening system applications (with Gemini fallback for unmapped apps)
def Applicate(action):
    sys_type = platform.system()
    action_key = str(action).lower().strip()

    if action_key in Application:
        command = Application[action_key].get(sys_type)
    else:
        # Fallback to Gemini to find launch command for unmapped app
        from backend.Actions.Gemini import gemini
        command = gemini(action_key, "app_launch_command")

    if not command:
        return f"Could not find launch command for application '{action}'."

    try:
        subprocess.Popen(command, shell=True)
        return f"'{action}' has been opened successfully."
    except Exception as e:
        return f"Unexpected error launching '{action}': {e}"

# For running programming files (with Gemini fallback for any language)
def Getcom(name, ex):
    s = platform.system()
    match ex.lower():
        case ".py":
            return f"python {name}.py" if s == "Windows" else f"python3 {name}.py"
        case ".c":
            return f"gcc {name}.c -o {name}.exe && {name}.exe" if s == "Windows" else f"gcc {name}.c -o {name}.exe && ./{name}"
        case ".cpp":
            return f"g++ {name}.cpp -o {name}.exe && {name}.exe" if s == "Windows" else f"g++ {name}.cpp -o {name}.exe && ./{name}"
        case ".java":
            return f"javac {name}.java && java {name}"
        case ".js":
            return f"node {name}.js"
        case ".ts":
            return f"tsc {name}.ts && node {name}.js"
        case ".cs":
            return f"csc {name}.cs && {name}.exe" if s == "Windows" else f"mcs {name}.cs && mono {name}.exe"
        case ".rs":
            return f"rustc {name}.rs && {name}.exe" if s == "Windows" else f"rustc {name}.rs && ./{name}"
        case ".go":
            return f"go build {name}.go && {name}.exe" if s == "Windows" else f"go build {name}.go && ./{name}"
        case _:
            from backend.Actions.Gemini import gemini
            return gemini(f"{name}{ex}", "compiler_command")

def Runcom(file_name, command):
    if not command:
        return "Unable to determine compile command."
    try:
        result = subprocess.run(command, check=True, timeout=90, shell=True, capture_output=True, text=True)
        return result.stdout.strip() if result.stdout else f"Program '{file_name}' executed successfully."
    except subprocess.CalledProcessError as e:
        return (e.stderr.strip() if e.stderr else str(e))
    except subprocess.TimeoutExpired as e:
        return "Command took longer than expected"
    except Exception as e:
        return f"Unexpected error: {e}"

def Runprogram(file):
    find = False
    file_name, file_ext = os.path.splitext(file)
    if not file_ext:
        # Search directory for file matching name
        for dir_file in os.listdir('.'):
            name, ext = os.path.splitext(dir_file)
            if name.lower() == file_name.lower():
                find = True
                command = Getcom(name, ext)
                return Runcom(name, command)
    else:
        # File extension provided explicitly
        if os.path.exists(file):
            command = Getcom(file_name, file_ext)
            return Runcom(file_name, command)

    if not find:
        return f"File '{file}' not found in current directory."