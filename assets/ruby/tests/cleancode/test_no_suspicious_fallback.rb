# frozen_string_literal: true

# Test: no suspicious fallback patterns.
# Detects begin/rescue blocks where rescue returns success without re-raising.

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

def has_return_without_raise?(node, skip_fns: true)
  return false unless node.is_a?(AST::Node)

  # Don't descend into nested function/class definitions
  return false if skip_fns && %i[def defs class module].include?(node.type)

  if node.type == :return && node.children[0]
    return true
  end

  node.children.any? do |c|
    c.is_a?(AST::Node) && has_return_without_raise?(c, skip_fns: skip_fns)
  end
end

def has_raise?(node)
  return false unless node.is_a?(AST::Node)

  return true if node.type == :raise

  node.children.any? { |c| c.is_a?(AST::Node) && has_raise?(c) }
end

SOURCE_FILES = source_files.freeze

SOURCE_FILES.each do |filepath|
  define_method("test_no_suspicious_fallback_in_#{filepath.gsub(/[^a-zA-Z0-9]/, '_')}") do
    code = File.read(filepath)
    buffer = Parser::Source::Buffer.new(filepath)
    buffer.source = code
    parser = Parser::CurrentRuby.new
    ast = parser.parse(buffer)
    skip "Cannot parse #{filepath}" unless ast

    violations = []
    walker = ->(node) do
      return unless node.is_a?(AST::Node)

      if %i[rescue kwbegin].include?(node.type)
        body_has_return = node.children.any? { |c| c.is_a?(AST::Node) && has_return_without_raise?(c, skip_fns: true) }

        if body_has_return
          rescue_nodes = node.children.select { |c| c.is_a?(AST::Node) && c.type == :resbody }
          rescue_nodes.each do |resbody|
            next if resbody.children.any? { |c| c.is_a?(AST::Node) && has_raise?(c) }

            if resbody.children.any? { |c| c.is_a?(AST::Node) && has_return_without_raise?(c, skip_fns: true) }
              violations << "  L#{resbody.loc.first_line}: rescue block returns success without re-raise"
            end
          end
        end
      end

      node.children.each { |c| walker.call(c) if c.is_a?(AST::Node) }
    end
    walker.call(ast)

    assert_empty violations, "Suspicious fallback(s) in #{filepath}:\n#{violations.join("\n")}"
  end
end