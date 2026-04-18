# Ruby Linting

This directory contains a RuboCop configuration with extra cops for performance, Rake, RSpec, and Sequel.

## Install

Add to your `Gemfile` (recommended):

```ruby
group :development do
  gem 'rubocop', require: false
  gem 'rubocop-performance', require: false
  gem 'rubocop-rake', require: false
  gem 'rubocop-rspec', require: false
  gem 'rubocop-sequel', require: false
end
```

Then install:

```bash
bundle install
```

## Use the config

Copy `ruby/rubocop.yml` into your project root as `.rubocop.yml`.

## Run

```bash
bundle exec rubocop
```
