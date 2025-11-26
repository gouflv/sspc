#!/usr/bin/env zx

import { readFile } from "fs/promises"
import "zx/globals"

const IMAGE_STORE = "/home/cxdev"
const DEPLOY_PATH = "/opt/sspc"

const CPU_LIMIT = "14.0"
const MEMORY_LIMIT = "8g"
const QUEUE_CONCURRENT_DEFAULT = 8

const SERVERS = [
  { remote: "cx_vision", concurrent: 8 },
  { remote: "cx_vision2", concurrent: 14 },
]

const { version: PPTR_VERSION } = JSON.parse(
  await readFile("./packages/pptr/package.json", "utf-8"),
)
const { version: QUEUE_VERSION } = JSON.parse(
  await readFile("./packages/queue/package.json", "utf-8"),
)

console.log(chalk.bold.cyan("\n=== SSPC Deployment Tool ===\n"))
console.log(chalk.gray(`pptr version: ${PPTR_VERSION}`))
console.log(chalk.gray(`queue version: ${QUEUE_VERSION}\n`))

// 选择要部署的应用
console.log(chalk.blue("Select application(s) to deploy:"))
console.log("  1. pptr")
console.log("  2. queue")
console.log("  3. Both (pptr + queue)")

const appChoice = await question("Select application (default: 3): ")
const appIndex = parseInt(appChoice) || 3

let selectedApps = []
if (appIndex === 1) {
  selectedApps = ["pptr"]
} else if (appIndex === 2) {
  selectedApps = ["queue"]
} else if (appIndex === 3) {
  selectedApps = ["pptr", "queue"]
} else {
  console.log(chalk.red("Invalid choice, exiting..."))
  process.exit(1)
}

// 选择要部署的服务器
console.log(chalk.blue("\nAvailable servers:"))
SERVERS.forEach((server, index) => {
  console.log(`  ${index + 1}. ${server.name} (${server.remote})`)
})
console.log(`  ${SERVERS.length + 1}. All servers`)

const serverChoice = await question("Select server(s) to deploy (default: 1): ")
const selectedIndex = parseInt(serverChoice) || 1

let selectedServers = []
if (selectedIndex === SERVERS.length + 1) {
  selectedServers = SERVERS
} else if (selectedIndex > 0 && selectedIndex <= SERVERS.length) {
  selectedServers = [SERVERS[selectedIndex - 1]]
} else {
  console.log(chalk.red("Invalid choice, exiting..."))
  process.exit(1)
}

console.log(
  chalk.green(
    `\nDeploying ${selectedApps.join(" + ")} to: ${selectedServers.map((s) => s.name).join(", ")}\n`,
  ),
)

// 部署函数
async function deployApp(server, app) {
  const isQueue = app === "queue"
  const version = isQueue ? QUEUE_VERSION : PPTR_VERSION
  const imageName = isQueue
    ? `sspc-queue:${version}.tar`
    : `sspc-pptr:${version}-bundle.tar`

  console.log(chalk.bold.blue(`\n--- Deploying ${app} to ${server.name} ---\n`))

  console.log(chalk.blue(`1. Copying ${app}:${version} to ${server.name}...`))
  await $`rsync -avP ./build/${imageName} ${server.remote}:${server.imageStore}`

  console.log(chalk.blue(`2. Loading Docker image on ${server.name}...`))
  await $`ssh ${server.remote} sudo docker load -i ${server.imageStore}/${imageName}`

  console.log(
    chalk.blue(`3. Compose up ${app}:${version} on ${server.name}...`),
  )
  await $`ssh ${server.remote} "cd ${server.deployPath} && sudo docker compose down ${app} && sudo docker compose up ${app} -d"`

  console.log(chalk.blue(`4. Checking status on ${server.name}...`))
  await sleep(2000)
  await $`ssh ${server.remote} "cd ${server.deployPath} && sudo docker compose ps ${app}"`

  console.log(
    chalk.green(`\n✓ ${app} deployment to ${server.name} completed!\n`),
  )
}

// 部署到选中的服务器
for (const server of selectedServers) {
  console.log(chalk.bold.magenta(`\n=== Deploying to ${server.name} ===\n`))

  // 如果部署多个应用，先确认是否更新 docker-compose.yml
  if (selectedApps.length > 0) {
    console.log(
      chalk.yellow(
        `Update docker-compose.yml manually if needed for ${server.name}, then press Enter to continue...`,
      ),
    )
    await question("")
    await $`rsync -avP ./docker-compose.yml ${server.remote}:${server.deployPath}/docker-compose.yml`
  }

  // 依次部署选中的应用
  for (const app of selectedApps) {
    await deployApp(server, app)
  }

  console.log(
    chalk.green(`\n✓✓ All deployments to ${server.name} completed!\n`),
  )
}

console.log(chalk.bold.green("\n=== All deployments completed! ===\n"))

// 询问是否查看日志
const viewLogs = await question("View logs from a server? (y/N): ")
if (viewLogs.toLowerCase() === "y") {
  let targetServer = selectedServers[0]

  // 如果有多个服务器，让用户选择
  if (selectedServers.length > 1) {
    console.log(chalk.blue("Select server to view logs:"))
    selectedServers.forEach((server, index) => {
      console.log(`  ${index + 1}. ${server.name}`)
    })
    const serverLogChoice = await question("Select server: ")
    const serverLogIndex = parseInt(serverLogChoice) - 1
    if (serverLogIndex >= 0 && serverLogIndex < selectedServers.length) {
      targetServer = selectedServers[serverLogIndex]
    }
  }

  let targetApp = selectedApps[0]

  // 如果部署了多个应用，让用户选择
  if (selectedApps.length > 1) {
    console.log(chalk.blue("Select application to view logs:"))
    selectedApps.forEach((app, index) => {
      console.log(`  ${index + 1}. ${app}`)
    })
    const appLogChoice = await question("Select application: ")
    const appLogIndex = parseInt(appLogChoice) - 1
    if (appLogIndex >= 0 && appLogIndex < selectedApps.length) {
      targetApp = selectedApps[appLogIndex]
    }
  }

  console.log(chalk.blue(`Logging ${targetApp} from ${targetServer.name}...`))
  await $`ssh ${targetServer.remote} "cd ${targetServer.deployPath} && sudo docker compose logs -f ${targetApp}"`
}
