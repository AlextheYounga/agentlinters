# Ruby setup

Add these gems to your `Gemfile` in the development group, then install:

```ruby
gem "rubocop"
gem "rubocop-performance"
gem "rubocop-rake"
gem "rubocop-rspec"
gem "rubocop-sequel"
```

Install clean-code test parser gem:

```ruby
gem "parser"
```

```bash
bundle install
```

Run clean-code tests:

```bash
ruby -Itests tests/cleancode/*.rb
```