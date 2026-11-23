# PR 使用三个工作流已有的主干路径；统一入口与此脚本的改动验证全部门禁。
require 'yaml'

base, head = ARGV
abort '需要 PR 的 base 和 head 提交' unless [base, head].all? { |sha| sha && sha.match?(/\A[0-9a-f]{40}\z/) }

%w[qian runtime-ts backend-copy].each do |name|
  workflow = YAML.safe_load(File.read(".github/workflows/#{name}.yml"))
  # YAML 1.1 将不加引号的 on 读作布尔值 true。
  events = workflow.fetch('on') { workflow.fetch(true) }
  paths = events.fetch('push').fetch('paths') + ['.github/workflows/pull-request.yml', 'scripts/ci/pr-gates.rb']
  abort "#{name} 的排除路径尚未定义 PR 匹配方式" if paths.any? { |path| path.start_with?('!') }
  pathspecs = paths.map { |path| ":(top,glob)#{path}" }
  system('git', 'diff', '--quiet', '--no-renames', "#{base}...#{head}", '--', *pathspecs)
  status = $?.exitstatus
  abort "#{name} 的变更范围读取失败" unless [0, 1].include?(status)
  puts "#{name}=#{status == 1}"
end
