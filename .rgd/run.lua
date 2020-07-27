-- Version 1.0
if branch == "development" then
    status = run("npm", "install")
    setStatus(status)
    status = run("npm", "run build")
    setStatus(status)
end