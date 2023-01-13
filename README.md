# Ayane

![ayane](https://raw.githubusercontent.com/if1live/ayane/main/document/ayane-pv.jpg)

> Free projects are paused after 1 week of inactivity.
> [supabase pricing](https://supabase.com/pricing)

When application is inactive, some PaaS suspend free-tier service.
Ayane send a simple request everyday to prevent suspension of free-tier service.

## features

* AWS Lambda + serverless framework
    - trigger: [schedule][serverless-schedule]
* supported services
    - mysql compatible server
        * ex: [planetscale][planetscale]
    - postgres compatible server
        * ex: [supabase][supabase]
    - redis
        * ex: [redislab][redislab]

## usage

```bash
cp .env.localhost .env
edit .env

remove line from .env if service not required
```

```bash
pnpm install
pnpx sls deploy
```

[supabase]: https://supabase.com/
[planetscale]: https://planetscale.com/
[redislab]: https://redis.com/
[serverless-schedule]: https://www.serverless.com/framework/docs/providers/aws/events/schedule
