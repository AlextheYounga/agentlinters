# frozen_string_literal: true

# Test: no provably unnecessary fallback patterns.
# Detects x || y where x is a always-truthy literal.

require "minitest/autorun"
require "parser/current"

PROJECT_ROOT = Dir.pwd.freeze
SRC_DIRS = %w[src app lib].freeze
IGNORE_DIRS = %w[vendor node_modules dist build coverage].freeze

def source_files
  SRC_DIRS.flat_map do |dir|
    path = File.join(PROJECT_ROOT, dir)
    next [] unless File.directory?(path)

    Dir.glob(File.join(path, "**/*.rb")).select do |f|
      rel = Pathname.new(f).relative_path_from(Pathname.new(PROJECT_ROOT)).to_s
      IGNORE_DIRS.none? { |ig| rel.include?(ig) }
    end
  end
end

def definitely_truthy?(node)
  case node.type
  when :str then !node.children.first.empty?
  when :int, :float then node.children.first != 0
  when :true then true
  when :array, :hash then !node.children.first.to_a.empty?
  when :sym then true
  else false
  end
end

SOURCE_FILES = source_files.freeze

SOURCE_FILES.each do |filepath|
  define_method("test_no_unnecessary_fallback_in_#{filepath.gsub(/[^a-zA-Z0-9]/, '_')}") do
    code = File.read(filepath)
    buffer = Parser::Source::Buffer.new(filepath)
    buffer.source = code
    parser = Parser::CurrentRuby.new
    ast = parser.parse(buffer)
    skip "Cannot parse #{filepath}" unless ast

    violations = []
    walker = ->(node) do
      return unless node.is_a?(AST::Node)

      if node.type == :or && definitely_truthy?(node.children[0])
        violations << "  L#{node.loc.first_line}: left side of `or` is always truthy"
      end
      node.children.each { |c| walker.call(c) if c.is_a?(AST::Node) }
    end
    walker.call(ast)

    assert_empty violations, "Unnecessary fallback(s) in #{filepath}:\n#{violations.join("\n")}"
  end
end