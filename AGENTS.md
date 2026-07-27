# How to Apply a change

## Preflight check
Check that the following MCPs are running.
**Critical**: if any of the following MCPs are not running, abort and inform the developer.
1. claude-in-chrome
2. chrome-devtools

## Prerequisite

1. Before to start any development run the project locally
```npm run shopify:theme:dev```

## Main development rule

Whenever you apply the change, test locally using the above command and MCPs to reproduce locally.
Continue iterating until you can't reproduce that the fix is working locally