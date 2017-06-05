# now-again

A tool for running jobs using Zeit's [now.sh](https://zeit.co/now) deployment platform.

It supports both scheduled (cron-style) jobs, as well as triggering jobs via HTTP.

## Why?

Running one-off or scheduled tasks is often annoying, expensive, and error prone. `now-again` lets you run a set of jobs, each written in any language, using a simple and cost effective deployment platform without any server configuration.

It's simpler than running tasks with AWS Lambda, and doesn't have the 5-minute runtime limit.

It's cheaper and easier to deploy and manage than an EC2 instance running cron.

It's better than setting up a bunch of scripts on a server, because each job can have its own dependencies and run in its own Docker container.


## Installation

`now-again` requires node 7.6 or higher, for native async/await support.

Install with `npm install --save RagtaOpen/now-again`

## Usage

To run the scheduler:

    const nowAgain = require('now-again')
    nowAgain.scheduler()
    
*TODO: add instructions for the HTTP job runner*
    
## Tasks

`now-again` will look for tasks in a `tasks` directory in your project. Tasks can either be node-based or Docker-based.

The only requirement for a task is that it prints `EOF` to standard output when it's done. If you're using node, that can be as simple as:

index.js:

    console.log('Hello world!')
    console.log('EOF')
    
package.json:

    {
      "scripts": {
        "start": "node index.js"
      }
    }
    
If you want a specific return value, you can pass a string after EOF, like `EOF: some return value`. It will handled as a string, but we recommend using JSON in most cases.

## Configuration

If you have a `task.json` file in your task directory, you can set some handy values.

    {
      "schedule": "every hour",
      "input": "cron cow!",
      "webhook": {
        "env": "MOO_WEBHOOK"
      },
      "exposeEnv": [
        "MESSAGE_PREFIX"
      ]
    }

### Schedule

  The `schedule` can either be a cron pattern or a [friendly-cron](https://www.npmjs.com/package/friendly-cron) string.
  
### Input

  `input` will be the job input. It can either be a string or a reference to an environment variable in the parent environment, like:
      "input" : {
        "env" : "SOME_JOB_INPUT"
      }
      
### Webhook

If a `webhook` value is provided, `now-again` will send an HTTP POST to that url on job completion, with the following payload format:
  
    {
      date: <iso formatted date>,
      finished: true,
      type: 'result',
      text: <output of task>,
      duration: {
        ms: <duration in milliseconds>,
        friendly: <human-readable duration>
      }
    }
        
Note: the webhook is currently only called at the end of a successful run, but it will eventually be used to report errors, as well.

We recommend creating a webhook with something like [Zapier](https://zapier.com/) to handle job completion notifications.
    
### ExposeEnv

If you add values to the `exposeEnv` array, `now-again` will map environment variables from the parent context to the task's `.env` file. This is the recommended way to pass secrets to a task.

Example:

Add a now secret:

    now secrets add my-api-key [api key value]

Expose the environment variable to your task:

task.json:

    {
      "exposeEnv": ["API_KEY"]
    }
    
Deploy your server with the secret mapped to an environment variable

    now deploy -e API_KEY=@my-api-key -e NOW_TOKEN=@now-token
  

## Input

When a task is run, `now-again` will create (or append to) a `.env` file, setting `INPUT` with the job input. You should use [dotenv](https://www.npmjs.com/package/dotenv) or your language's equivalent to read these values.


## Example project

Check out the [example project](https://github.com/RagtagOpen/now-again-example) to see it in action.

## Deployment

First, make sure you have the [now tools](https://zeit.co/download) installed.

Then, copy your token value from `~/.now.json` and set that as a secret:

    now secrets add now-token your_token_value

Deploy your project with `now deploy -e NOW_TOKEN=@now-token` to make that secret available to your app.

When deploying to now, make sure to use [now scale](https://zeit.co/blog/scale) to set the number of instances to 1, otherwise the server will go to sleep and the jobs won't run.
