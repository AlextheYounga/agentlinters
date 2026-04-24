Source Tree:

```txt
ruby
|-- .gitignore
|-- rubocop.yml
`-- ruby-linters.md
```

`.gitignore`:

```txt
*.gem
*.rbc
/.config
/coverage/
/InstalledFiles
/pkg/
/spec/reports/
/spec/examples.txt
/test/tmp/
/test/version_tmp/
/tmp/

# Used by dotenv library to load environment variables.
# .env

# Ignore Byebug command history file.
.byebug_history

## Specific to RubyMotion:
.dat*
.repl_history
build/
*.bridgesupport
build-iPhoneOS/
build-iPhoneSimulator/

## Specific to RubyMotion (use of CocoaPods):
#
# We recommend against adding the Pods directory to your .gitignore. However
# you should judge for yourself, the pros and cons are mentioned at:
# https://guides.cocoapods.org/using/using-cocoapods.html#should-i-check-the-pods-directory-into-source-control
#
# vendor/Pods/

## Documentation cache and generated files:
/.yardoc/
/_yardoc/
/doc/
/rdoc/

## Environment normalization:
/.bundle/
/vendor/bundle
/lib/bundler/man/

# for a library or gem, you might want to ignore these files since the code is
# intended to run in multiple environments; otherwise, check them in:
# Gemfile.lock
# .ruby-version
# .ruby-gemset

# unless supporting rvm < 1.11.0 or doing something fancy, ignore this:
.rvmrc

# Used by RuboCop. Remote config files pulled in from inherit_from directive.
# .rubocop-https?--*

# General
.DS_Store
*DS_Store
Thumbs.db
Desktop.ini
*.db
*.sqlite
*.sqlite3
__trash__
.Trashes
*.log
*.tmp
*.temp
*.bak
*~
*.swp
*.swo
```

`rubocop.yml`:

```yml
require:
  - rubocop-performance
  - rubocop-rake
  - rubocop-rspec
  - rubocop-sequel

inherit_from: .rubocop_todo.yml

AllCops:
  NewCops: enable
  SuggestExtensions: false

Layout/ParameterAlignment:
  EnforcedStyle: with_fixed_indentation
Layout/ArgumentAlignment:
  Enabled: false
Layout/CaseIndentation:
  IndentOneStep: false
  Enabled: true
Layout/DotPosition:
  EnforcedStyle: leading
  Enabled: false
Layout/ElseAlignment:
  Enabled: true
Layout/EndAlignment:
  Enabled: true
Layout/EmptyLineAfterGuardClause:
  Enabled: false
Layout/EmptyLinesAroundBlockBody:
  Enabled: false
Layout/HashAlignment:
  EnforcedHashRocketStyle: ['table', 'key']
  EnforcedColonStyle: ['table', 'key']
Layout/MultilineMethodCallIndentation:
  EnforcedStyle: indented
  Enabled: false
Layout/MultilineOperationIndentation:
  EnforcedStyle: indented
Layout/SpaceAroundEqualsInParameterDefault:
  EnforcedStyle: no_space
  Enabled: false
Layout/SpaceInsideHashLiteralBraces:
  EnforcedStyle: no_space
  Enabled: false

# https://rubocop.readthedocs.io/en/latest/cops_metrics/#metrics
Metrics/AbcSize:
  Enabled: false
Metrics/BlockLength:
  Enabled: false
Metrics/ClassLength:
  Enabled: false
Metrics/CyclomaticComplexity:
  Enabled: false
Layout/LineLength:
  Max: 120
Metrics/MethodLength:
  Enabled: false
Metrics/ModuleLength:
  Enabled: false
Metrics/ParameterLists:
  CountKeywordArgs: false
Metrics/PerceivedComplexity:
  Enabled: false

Lint/BinaryOperatorWithIdenticalOperands:
  Enabled: false
Lint/ConstantDefinitionInBlock:
  Exclude:
    - 'spec/**/*'
Lint/EmptyBlock:
  Enabled: false
Lint/UselessAssignment:
  Exclude:
    - 'spec/**/*'

# https://rubocop.readthedocs.io/en/latest/cops_naming/
Naming/AccessorMethodName:
  Enabled: false
Naming/PredicateName:
  Enabled: false
Naming/MethodParameterName:
  Enabled: false

Sequel/ColumnDefault:
  Enabled: false
Sequel/ConcurrentIndex:
  Enabled: false

RSpec/BeforeAfterAll:
  Enabled: false
RSpec/ContextWording:
  Enabled: false
RSpec/DescribeClass:
  Enabled: false
RSpec/EmptyExampleGroup:
  Enabled: false
RSpec/EmptyLineAfterSubject:
  Exclude:
    - 'spec/factories/**/*.rb'
RSpec/EmptyLineAfterExample:
  Exclude:
    - 'spec/factories/**/*.rb'
RSpec/ExampleLength:
  Enabled: false
RSpec/ExpectInHook:
  Enabled: false
RSpec/HookArgument:
  EnforcedStyle: 'each'
RSpec/InstanceVariable:
  Enabled: false
RSpec/MessageSpies:
  Enabled: false
RSpec/MultipleMemoizedHelpers:
  Enabled: false
RSpec/MultipleExpectations:
  Enabled: false
RSpec/NestedGroups:
  Max: 4
RSpec/NotToNot:
  EnforcedStyle: 'to_not'
RSpec/StubbedMock:
  Enabled: false
RSpec/AnyInstance:
  Enabled: false

# https://rubocop.readthedocs.io/en/latest/cops_style/
Style/AccessModifierDeclarations:
  EnforcedStyle: inline
  Enabled: false
Style/AndOr:
  EnforcedStyle: conditionals
Style/CaseEquality:
  Enabled: false
Style/ClassAndModuleChildren:
  EnforcedStyle: compact
Style/FormatStringToken:
  Enabled: false
Style/GuardClause:
  Enabled: false
Style/Documentation:
  Enabled: false
Style/FormatString:
  EnforcedStyle: percent
Style/HashLikeCase:
  Enabled: false
Style/NumericLiterals:
  Enabled: false
Style/NumericPredicate:
  AllowedMethods: ['where', 'exclude', 'having']
Style/LambdaCall:
  Enabled: false
Style/RedundantReturn:
  Enabled: true
Style/RedundantSelf:
  Enabled: true
Style/StringConcatenation:
  Enabled: false
Style/StringLiterals:
  EnforcedStyle: double_quotes
Style/SymbolArray:
  Enabled: false
Style/TrailingCommaInArguments:
  Enabled: false
Style/TrailingCommaInArrayLiteral:
  EnforcedStyleForMultiline: consistent_comma
  Enabled: false
Style/TrailingCommaInHashLiteral:
  EnforcedStyleForMultiline: consistent_comma
  Enabled: false
Style/TrailingUnderscoreVariable:
  Enabled: false
Style/OpenStructUse:
  Exclude:
    - 'spec/**/*'
Style/WordArray:
  Enabled: false

Performance/TimesMap:
  Exclude:
    - 'spec/**/*'
```

`ruby-linters.md`:

````md
Source Tree:

```txt
ruby
`-- rubocop.yml
```

`rubocop.yml`:

```yml
require:
  - rubocop-performance
  - rubocop-rake
  - rubocop-rspec
  - rubocop-sequel

inherit_from: .rubocop_todo.yml

AllCops:
  NewCops: enable
  SuggestExtensions: false

Layout/ParameterAlignment:
  EnforcedStyle: with_fixed_indentation
Layout/ArgumentAlignment:
  Enabled: false
Layout/CaseIndentation:
  IndentOneStep: false
  Enabled: true
Layout/DotPosition:
  EnforcedStyle: leading
  Enabled: false
Layout/ElseAlignment:
  Enabled: true
Layout/EndAlignment:
  Enabled: true
Layout/EmptyLineAfterGuardClause:
  Enabled: false
Layout/EmptyLinesAroundBlockBody:
  Enabled: false
Layout/HashAlignment:
  EnforcedHashRocketStyle: ['table', 'key']
  EnforcedColonStyle: ['table', 'key']
Layout/MultilineMethodCallIndentation:
  EnforcedStyle: indented
  Enabled: false
Layout/MultilineOperationIndentation:
  EnforcedStyle: indented
Layout/SpaceAroundEqualsInParameterDefault:
  EnforcedStyle: no_space
  Enabled: false
Layout/SpaceInsideHashLiteralBraces:
  EnforcedStyle: no_space
  Enabled: false

# https://rubocop.readthedocs.io/en/latest/cops_metrics/#metrics
Metrics/AbcSize:
  Enabled: false
Metrics/BlockLength:
  Enabled: false
Metrics/ClassLength:
  Enabled: false
Metrics/CyclomaticComplexity:
  Enabled: false
Layout/LineLength:
  Max: 120
Metrics/MethodLength:
  Enabled: false
Metrics/ModuleLength:
  Enabled: false
Metrics/ParameterLists:
  CountKeywordArgs: false
Metrics/PerceivedComplexity:
  Enabled: false

Lint/BinaryOperatorWithIdenticalOperands:
  Enabled: false
Lint/ConstantDefinitionInBlock:
  Exclude:
    - 'spec/**/*'
Lint/EmptyBlock:
  Enabled: false
Lint/UselessAssignment:
  Exclude:
    - 'spec/**/*'

# https://rubocop.readthedocs.io/en/latest/cops_naming/
Naming/AccessorMethodName:
  Enabled: false
Naming/PredicateName:
  Enabled: false
Naming/MethodParameterName:
  Enabled: false

Sequel/ColumnDefault:
  Enabled: false
Sequel/ConcurrentIndex:
  Enabled: false

RSpec/BeforeAfterAll:
  Enabled: false
RSpec/ContextWording:
  Enabled: false
RSpec/DescribeClass:
  Enabled: false
RSpec/EmptyExampleGroup:
  Enabled: false
RSpec/EmptyLineAfterSubject:
  Exclude:
    - 'spec/factories/**/*.rb'
RSpec/EmptyLineAfterExample:
  Exclude:
    - 'spec/factories/**/*.rb'
RSpec/ExampleLength:
  Enabled: false
RSpec/ExpectInHook:
  Enabled: false
RSpec/HookArgument:
  EnforcedStyle: 'each'
RSpec/InstanceVariable:
  Enabled: false
RSpec/MessageSpies:
  Enabled: false
RSpec/MultipleMemoizedHelpers:
  Enabled: false
RSpec/MultipleExpectations:
  Enabled: false
RSpec/NestedGroups:
  Max: 4
RSpec/NotToNot:
  EnforcedStyle: 'to_not'
RSpec/StubbedMock:
  Enabled: false
RSpec/AnyInstance:
  Enabled: false

# https://rubocop.readthedocs.io/en/latest/cops_style/
Style/AccessModifierDeclarations:
  EnforcedStyle: inline
  Enabled: false
Style/AndOr:
  EnforcedStyle: conditionals
Style/CaseEquality:
  Enabled: false
Style/ClassAndModuleChildren:
  EnforcedStyle: compact
Style/FormatStringToken:
  Enabled: false
Style/GuardClause:
  Enabled: false
Style/Documentation:
  Enabled: false
Style/FormatString:
  EnforcedStyle: percent
Style/HashLikeCase:
  Enabled: false
Style/NumericLiterals:
  Enabled: false
Style/NumericPredicate:
  AllowedMethods: ['where', 'exclude', 'having']
Style/LambdaCall:
  Enabled: false
Style/RedundantReturn:
  Enabled: true
Style/RedundantSelf:
  Enabled: true
Style/StringConcatenation:
  Enabled: false
Style/StringLiterals:
  EnforcedStyle: double_quotes
Style/SymbolArray:
  Enabled: false
Style/TrailingCommaInArguments:
  Enabled: false
Style/TrailingCommaInArrayLiteral:
  EnforcedStyleForMultiline: consistent_comma
  Enabled: false
Style/TrailingCommaInHashLiteral:
  EnforcedStyleForMultiline: consistent_comma
  Enabled: false
Style/TrailingUnderscoreVariable:
  Enabled: false
Style/OpenStructUse:
  Exclude:
    - 'spec/**/*'
Style/WordArray:
  Enabled: false

Performance/TimesMap:
  Exclude:
    - 'spec/**/*'
```

````

