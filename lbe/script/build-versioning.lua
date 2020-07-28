require("lua.io")
require("lua.config")

config = FastConfig.New("./src/config/version.yml")
config.load()
if config.has("Major") == false then
  config.set("Major", 1)
end
if config.has("Minor") == false then
  config.set("Minor", 0)
end
if config.has("Patch") == false then
  config.set("Patch", 0)
end
if config.has("Build") == false then
  config.set("Build", 1)
end
major = config.getInt("Major")
minor = config.getInt("Minor")
patch = config.getInt("Patch")
build = config.getInt("Build")
build = build + 1
config.set("Build", build)
config.save()

templateFile = File.open("./lbe/script/template/version.ts", FileMode.Open)
reader = StreamReader.New(templateFile)
templateData = reader.readToEnd()
reader.close();
reader.dispose();
templateFile.dispose();

templateData = templateData:gsub("!Major", tostring(major))
templateData = templateData:gsub("!Minor", tostring(minor))
templateData = templateData:gsub("!Patch", tostring(patch))
templateData = templateData:gsub("!Build", tostring(build))

if File.exists("./src/version.generated.ts") == false then
  File.create("./src/version.generated.ts").dispose()
end
generatedFile = File.open("./src/version.generated.ts", FileMode.Open)
generatedFile.setLength(0)
writer = StreamWriter.New(generatedFile)
writer.write(templateData)
writer.close();
writer.dispose();
generatedFile.dispose();