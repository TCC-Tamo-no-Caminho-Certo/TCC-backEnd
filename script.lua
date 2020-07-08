print("[LuaBuildEvents] Starting Backend Post Pull\n");

function executeProcess(exec, args)
    print("Executing repository script...\n");
    processStartInfo = ProcessStartInfo.New(exec, args);
    processStartInfo.redirectStandardOutput = true;
    processStartInfo.workingDirectory = Directory.getCurrentDirectory();
    process = Process.New(processStartInfo);
    process.start();
    data = process.standardOutput.readToEnd();
    print(data);
end

print("Running 'npm install'...\n");
executeProcess("npm", "install");

--print("Running 'npm build'...");
--executeProcess("npm", "run build");

--print("Running 'pm2 stop nodedeploy'...");
--executeProcess("pm2", "stop nodedeploy");

--print("Running 'pm2 start dist/server.js --name nodedeploy'...");
--executeProcess("pm2", "start dist/server.js --name nodedeploy");

print("[LuaBuildEvents] Finishing Backend Post Pull\n");