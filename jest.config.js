/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testPathIgnorePatterns: ["/node_modules/", "/azure-sdk-for-js/"],
  modulePathIgnorePatterns: ["/node_modules/", "/azure-sdk-for-js/"]
};
