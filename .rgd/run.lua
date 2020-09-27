-- Version 1.5.1

function runStat(filename, args, workDir, env)
    status = run(filename, args, workDir, env)
    setStatus(status)
    return status != 0
end

function runScript()
    if repoBranch == "development" then
        if runStat("npm", "--no-color install") then return end
        if runStat("rm", "-rfv ./build/") then return end
        if runStat("npm", "--no-color run build") then return end
        if runStat("npm", "--no-color run knex:migrate", "", "CONFIGPATH=/home/rgd/deploy/dev/.config/server.json") then return end
        if runStat("npm", "--no-color run knex:seed", "", "CONFIGPATH=/home/rgd/deploy/dev/.config/server.json") then return end
        run("pm2", "stop backend-dev", "/home/rgd/deploy/dev/backend")
        if runStat("rm", "-rfv /home/rgd/deploy/dev/backend/") then return end
        if runStat("cp", "-rv ./build/ /home/rgd/deploy/dev/backend/") then return end
        if runStat("ln", "-s " .. repoDirectory .. "/node_modules /home/rgd/deploy/dev/backend/node_modules") then return end
        run("pm2", "start ./bundle.js --name backend-dev -- --config-/home/rgd/deploy/dev/.config/server.json", "/home/rgd/deploy/dev/backend")
    elseif repoBranch == "master" then
        if runStat("npm", "--no-color install") then return end
        if runStat("rm", "-rfv ./build/") then return end
        if runStat("npm", "--no-color run build") then return end
        if runStat("npm", "--no-color run knex:migrate", "", "CONFIGPATH=/home/rgd/deploy/dist/.config/server.json") then return end
        if runStat("npm", "--no-color run knex:seed", "", "CONFIGPATH=/home/rgd/deploy/dist/.config/server.json") then return end
        run("pm2", "stop backend-dist", "/home/rgd/deploy/dist/backend")
        if runStat("rm", "-rfv /home/rgd/deploy/dist/backend/") then return end
        if runStat("cp", "-rv ./build/ /home/rgd/deploy/dist/backend/") then return end
        if runStat("ln", "-s " .. repoDirectory .. "/node_modules /home/rgd/deploy/dist/backend/node_modules") then return end
        run("pm2", "start ./bundle.js --name backend-dist -- --config-/home/rgd/deploy/dist/.config/server.json", "/home/rgd/deploy/dist/backend")
    end
end

runScript()