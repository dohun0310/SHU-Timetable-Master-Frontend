FROM node:24-bookworm-slim AS dependencies
WORKDIR /app

COPY package.json yarn.lock .yarnrc.yml ./
RUN corepack yarn install --immutable

FROM node:24-bookworm-slim AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN corepack yarn build

FROM node:24-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000

RUN groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

# 빌드 시점에 정적 파일로 생성되는 app/favicon.ico로 서버 응답을 확인한다.
# 본문을 읽지 않으면 연결이 끊길 때까지 node가 종료되지 않아 시간 제한을 넘기므로 HEAD로 요청한다.
# 파비콘을 옮기거나 삭제하면 헬스체크가 실패하므로 이 경로도 함께 바꿔야 한다.
HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:' + process.env.PORT + '/favicon.ico', { method: 'HEAD' }).then((response) => { if (!response.ok) process.exit(1) }).catch(() => process.exit(1))"]

CMD ["node", "server.js"]
