FROM node:slim

ENV PORT 3000

ADD . /srv/www

WORKDIR /srv/www

RUN npm install --unsafe-perm

EXPOSE 3000

CMD ./bin/slackin --coc "$SLACK_COC" --channels "$SLACK_CHANNELS" --port $PORT --path /slack/ $SLACK_SUBDOMAIN $SLACK_API_TOKEN
