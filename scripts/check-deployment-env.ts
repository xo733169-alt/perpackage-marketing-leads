// @ts-nocheck
const { checkDeploymentEnv, formatDeploymentEnvCheck } = require("../src/lib/deployment-env.ts");

const result = checkDeploymentEnv(process.env);

console.log(formatDeploymentEnvCheck(result));

if (!result.ok) {
  process.exitCode = 1;
}
