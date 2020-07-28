-- Version 1.1
if branch == "development" then
    status = run("npm", "--no-color install")
    setStatus(status)
    status = run("npm", "--no-color run build")
    setStatus(status)
elseif branch == "master" then
    status = run("npm", "--no-color install")
    setStatus(status)
    status = run("npm", "--no-color run build")
    setStatus(status)
    status = run("rm", "-rfv /home/rgd/deploy/backend/")
end
