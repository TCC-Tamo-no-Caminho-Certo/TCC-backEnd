print("[LuaBuildEvents] Starting Backend Post Pull\n");

require("lua.system");
require("lua.io");

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

-- Create base directory
distPath = "/home/backend/dist"
outputPath = "/home/backend/lbe/dev_backend/src/"
if Directory.exists(distPath) == false then
  Directory.createDirectory(distPath)
end

-- Delete old data
oldFiles = Directory.getFiles(distPath, "*.*", SearchOption.AllDirectories)
for key,value in ipairs(oldFiles) do
  print("Deleting file: " .. value .. "\n")
  File.delete(value)
end
oldDirectories = Directory.getDirectories(distPath, "*", SearchOption.TopDirectoryOnly)
for key,value in ipairs(oldDirectories) do
  print("Deleting directory: " .. value .. "\n")
  Directory.delete(value, true)
end

-- Create directories
outputDirectory = Path.combine(Directory.getCurrentDirectory(), "src");
outputDirectories = Directory.getDirectories(outputDirectory, "*", SearchOption.AllDirectories)
for key,value in ipairs(outputDirectories) do
  directoryReplace = value:gsub(outputPath, "")
  fixedDirectory = Path.combine(distPath, directoryReplace)
  if Directory.exists(fixedDirectory) == false then
    print("Creating directory: " .. fixedDirectory .. "\n")
    Directory.createDirectory(fixedDirectory)
  end
end

-- Copy files
outputFiles = Directory.getFiles(outputDirectory, "*.*", SearchOption.AllDirectories)
for key,value in ipairs(outputFiles) do
  fileNameReplace = value:gsub(outputPath, "")
  fixedFileName = Path.combine(distPath, fileNameReplace)
  print("Copying file: " .. fixedFileName .. "\n")
  File.copy(value, fixedFileName, true)
end

print("Running 'pm2 stop nodedeploy'...");
executeProcess("pm2", "stop nodedeploy");

print("Running 'pm2 start /home/backend/lbe/dev_backend/src/server.js --name nodedeploy'...");
executeProcess("pm2", "start /home/backend/lbe/dev_backend/src/server.js --name nodedeploy");

print("[LuaBuildEvents] Finishing Backend Post Pull\n");