-- Version 1.0
if branch == "development" then
    status = run("npm", "install")
    setStatus(status)
    status = run("npm", "run build")
    setStatus(status)
elseif branch == "master" then
    status = run("npm", "install")
    setStatus(status)
    status = run("npm", "run build")
    setStatus(status)
    status = run("rm", "-rfv /home/rgd/deploy/backend/")
end
