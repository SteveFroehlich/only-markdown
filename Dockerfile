FROM ruby:3.3

WORKDIR /site

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    git \
    nodejs \
    && rm -rf /var/lib/apt/lists/*

RUN gem install bundler

COPY Gemfile Gemfile.lock* ./
RUN bundle install

COPY _config.yml .
COPY _layouts ./_layouts
COPY assets ./assets
COPY index.md ./
COPY _documents ./_documents

EXPOSE 4000

CMD ["bundle", "exec", "jekyll", "serve", "--host", "0.0.0.0", "--livereload", "--force_polling"]
