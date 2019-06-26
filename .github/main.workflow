workflow "Build, Test, and Publish" {
  on = "push"
  resolves = "Publish"
}

action "Build" {
  uses = "actions/npm@master"
  args = "install"
  secrets = ["NPM_AUTH_TOKEN"]
}

action "Submodules" {
  uses = "docker://alpine/git:latest"
  args = "submodule update --init --recursive"
}

action "Test" {
  needs = ["Build", "Submodules"]
  uses = "actions/npm@master"
  args = "test"
}

action "Lint" {
  needs = "Build"
  uses = "actions/npm@master"
  args = "run lint"
}

action "Tag" {
  needs = ["Test", "Lint"]
  uses = "actions/bin/filter@master"
  args = "tag"
}

action "Publish" {
  needs = "Tag"
  uses = "actions/npm@master"
  args = "publish"
  secrets = ["NPM_AUTH_TOKEN"]
}
