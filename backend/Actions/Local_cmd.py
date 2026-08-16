# still need to create function for creating things, opening website and system application, and finally a function for running a programming file
# Need to create if else block for selecting which function to call 

import platform
import subprocess
import os

system_commands = {

    # add change dir and move dir to the system commands

    "show files": {
        "Windows": "dir",
        "Linux": "ls"
    },

    "show hidden files": {
        "Windows": "dir /a",
        "Linux": "ls -la"
    },

    "current directory": {
        "Windows": "pwd",
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

   "cmd":{
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

# For executing the system commands

def system(action):
    system = platform.system()

    if action not in system_commands:
        return "Unknown command"

    command = system_commands[action].get(system)

    if not command:
        return f"{system} is not supported"

    try:
        result = subprocess.run(command, check = True, timeout = 60, shell = True, capture_output = True, text = True)
        return  result.stdout.strip()

    except subprocess.CalledProcessError as e:
        return (e.stderr.strip() if e.stderr else str(e))

    except subprocess.TimeoutExpired as e:
        return "Command is time out after 60 seconds"

    except Exception as e:
        return f"Unexpected error {e}"

# For creating files and folders

def create(action, name):
    system = platform.system()

    if action not in create_command:
        return "Unknown command"

    command = create_command[action].get(system)

    if not command:
        return f"{system} is not supported"

    try:
        full_command = f"{command} {name}"
        result = subprocess.run(full_command, check=True, timeout=60, shell=True, capture_output=True, text=True)
        return result.stdout.strip() if result.stdout else f"{action} '{name}' created successfully."

    except subprocess.CalledProcessError as e:
        return (e.stderr.strip() if e.stderr else str(e))

    except subprocess.TimeoutExpired as e:
        return "Command timed out after 60 seconds"

    except Exception as e:
        return f"Unexpected error: {e}"

# For opening the website


# For opening the system application

def Applicate(action):
    system = platform.system()
    if action not in Application:
        return "Unknown application" # need to change
    try:
        command = Application[action].get(system)
        if not command:
            return f"{system} is not supported"

        subprocess.Popen(command, shell=True)
        return f"'{action}' has been opened successfully 🥳."
    except Exception as e:
        return f"Unexpected error: {e}"

# For running the programming files

def Getcom(name,ex):
    s = platform.system()
    match ex :
        case ".py":
                return f"python {name}.py" if s=="Windows" else f"python3 {name}.py"
        case ".c":
            return f"gcc {name}.c -o {name}.exe && {name}.exe" if s=="Windows" else f"gcc {name}.c -o {name}.exe && ./{name}"
        case ".cpp":
            return f"g++ {name}.cpp -o {name}.exe && {name}.exe" if s=="Windows" else f"g++ {name}.cpp -o {name}.exe && ./{name}"
        case ".java":
            return f"javac {name}.java && java {name}" if s=="Windows" else f"javac {name}.java && java {name}"
        case ".js": 
            return f"node {name}.js" if s=="Windows" else f"node {name}.js"
        case ".ts": 
            return f"tsc {name}.ts && node {name}.js" if s=="Windows" else f"tsc {name}.ts && node {name}.js"
        case ".cs": 
            return f"csc {name}.cs && {name}.exe" if s=="Windows" else f"mcs {name}.cs && mono {name}.exe"
        case ".rs":
            return f"rustc {name}.rs && {name}.exe" if s=="Windows" else f"rustc {name}.rs && ./{name}"
        case ".go":
            return f"go build {name}.go && {name}.exe" if s=="Windows" else f"go build {name}.go && ./{name}"
        case _:
            return "Gemini call" # Change this to the gemini function

def Runcom(file_name, command):
    if command == "Gemini call":
        return "Called the gemini"
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
    file_name = os.path.splitext(file)[0]
    for dir_file in os.listdir('.'):
        name, ext = os.path.splitext(dir_file)
        if name.lower() == file_name.lower():
            find = True
            command = Getcom(file_name, ext)
            return Runcom(file_name, command)
    if not find:
        return "File not exist in this directory"

if __name__ == "__main__":
    a = input("website: ")
    print(Runprogram(a))