export interface Cheatsheet {
  id: string;
  title: string;
  topic: string;
  summary: string;
  content: string;
  canonicalUrl: string;
}

export const CHEATSHEETS: Record<string, Cheatsheet> = {
  ansible: {
    id: "ansible",
    title: "Ansible Ad-Hoc Commands & Automation Cheatsheet",
    topic: "ansible",
    summary: "Complete reference for Ansible ad-hoc commands, privilege escalation, idempotent modules, Vault, and AWS dynamic inventory.",
    canonicalUrl: "https://interview.naveedkumbhar.com/guides/ansible-commands-cheat-sheet/",
    content: `# Ansible Ad-Hoc Commands & Automation Cheatsheet

## Basic Syntax
\`\`\`bash
ansible <host-pattern> -m <module> -a "<module-arguments>" [-i inventory] [-b]
\`\`\`

## Essential Ad-Hoc Commands
- **Ping / Connectivity Check:**
  \`ansible all -m ping\`
- **Check Uptime & Host Information:**
  \`ansible webservers -m command -a "uptime"\`
- **Reboot Nodes Gracefully:**
  \`ansible staging -m reboot -b\`

## Package & Service Management (Idempotent)
- **Install & Start Nginx:**
  \`ansible web -m apt -a "name=nginx state=present update_cache=yes" -b\`
  \`ansible web -m service -a "name=nginx state=started enabled=yes" -b\`
- **Restart Service After Config Change:**
  \`ansible web -m systemd -a "name=nginx state=restarted" -b\`

## File Operations
- **Copy Local File to Remote:**
  \`ansible all -m copy -a "src=./app.conf dest=/etc/app/app.conf mode=0644 owner=root group=root" -b\`
- **Create Directory:**
  \`ansible all -m file -a "path=/var/log/app state=directory mode=0755 owner=appuser" -b\`
- **Remove File / Ensure Absent:**
  \`ansible all -m file -a "path=/tmp/test.txt state=absent"\`

## User & Security Management
- **Create User with Sudo Access:**
  \`ansible all -m user -a "name=deployer groups=sudo append=yes shell=/bin/bash" -b\`
- **Deploy SSH Public Key:**
  \`ansible all -m authorized_key -a "user=deployer state=present key='{{ lookup('file', '~/.ssh/id_rsa.pub') }}'" -b\`

## Dynamic AWS EC2 Inventory
- **Configuration (aws_ec2.yaml):**
  \`\`\`yaml
  plugin: amazon.aws.aws_ec2
  regions:
    - eu-west-1
  keyed_groups:
    - key: tags['Environment']
      prefix: env
  \`\`\`
- **Verify Inventory Graph:**
  \`ansible-inventory -i aws_ec2.yaml --graph\`

## Ansible Vault Secrets
- \`ansible-vault create secrets.yml\`
- \`ansible-vault encrypt credentials.env\`
- \`ansible-vault decrypt credentials.env\`
- \`ansible-vault view secrets.yml\`
- \`ansible-playbook site.yml --ask-vault-pass\` (or \`--vault-password-file .vault_pass\`)

## Performance Tuning
- In \`ansible.cfg\`:
  \`\`\`ini
  [defaults]
  forks = 20
  gathering = smart
  fact_caching = jsonfile
  fact_caching_connection = /tmp/ansible_facts
  fact_caching_timeout = 86400
  [ssh_connection]
  pipelining = True
  \`\`\`
`
  },
  kubectl: {
    id: "kubectl",
    title: "Kubectl Production Triage & SRE Cheatsheet",
    topic: "kubectl",
    summary: "Rapid diagnostic commands for Kubernetes pods, nodes, networking, DNS, and control-plane triage.",
    canonicalUrl: "https://k8s.naveedkumbhar.com/cheatsheet/",
    content: `# Kubectl Production Triage & SRE Cheatsheet

## 60-Second Pod Triage
- **Find all non-running pods across all namespaces:**
  \`kubectl get pods -A --field-selector status.phase!=Running\`
- **Inspect previous container death logs (exit code 137, 143, 1):**
  \`kubectl logs <pod-name> -n <namespace> --previous --tail=100\`
- **Live tail logs across all matching replica pods:**
  \`kubectl logs -f -l app=api -n production --max-log-requests=10 --tail=50\`
- **Deep-inspect termination reason and probe failures:**
  \`kubectl describe pod <pod-name> -n <namespace> | grep -E "State:|Reason:|Exit Code:|Last State:|Events:"\`

## Node Pressure & Capacity Triage
- **Node CPU & Memory Utilization:**
  \`kubectl top nodes --sort-by=memory\`
  \`kubectl top nodes --sort-by=cpu\`
- **Check Node Conditions & Taints:**
  \`kubectl get nodes -o custom-columns=NAME:.metadata.name,STATUS:.status.conditions[-1].type,REASON:.status.conditions[-1].reason,TAINTS:.spec.taints\`
- **Pod Resource Consumption in Namespace:**
  \`kubectl top pods -n production --sort-by=memory\`

## Ephemeral Debugging & Network Testing
- **Spawn temporary network troubleshooting pod:**
  \`kubectl run netshoot --rm -i --tty --image=nicolaka/netshoot -- /bin/bash\`
- **Verify CoreDNS resolution inside cluster:**
  \`nslookup kubernetes.default.svc.cluster.local 10.96.0.10\`
  \`dig api.production.svc.cluster.local +short\`
- **Port-forward Service locally:**
  \`kubectl port-forward svc/my-service 8080:80 -n production\`

## Extracting Secrets & Manifests
- **Decode Secret directly in terminal:**
  \`kubectl get secret my-secret -n production -o jsonpath='{.data.password}' | base64 -d\`
- **Export clean YAML without managedFields and timestamps:**
  \`kubectl get deployment my-app -n production -o yaml | kubectl neat > my-app-clean.yaml\`

## Common Exit Codes Matrix
| Exit Code | Name | Cause | Immediate Action |
|:---|:---|:---|:---|
| **137** | SIGKILL | OOMKilled (Memory limit exceeded) or node evicted | Increase memory limits or profile memory leaks |
| **143** | SIGTERM | Graceful termination during scale down or rollout | Ensure application finishes active requests |
| **1** | Application Error | Uncaught exception, failed DB handshake, bad config | Check application logs using \`--previous\` |
| **127** | Command Not Found | Missing binary in scratch or distroless container | Fix Dockerfile CMD / ENTRYPOINT path |
`
  },
  subnetting: {
    id: "subnetting",
    title: "Subnetting CIDR Mental Math & AWS Networking Cheatsheet",
    topic: "subnetting",
    summary: "The Magic Number method for rapid CIDR calculation, AWS 5 reserved IPs, and EKS secondary IP calculations.",
    canonicalUrl: "https://blog.naveedkumbhar.com/subnetting-cheat-sheet/",
    content: `# Subnetting CIDR Mental Math & AWS Networking Cheatsheet

## The Magic Number Formula
For any CIDR prefix /N:
1. Determine the active octet:
   - /1 to /8: 1st octet
   - /9 to /16: 2nd octet
   - /17 to /24: 3rd octet
   - /25 to /32: 4th octet
2. **Magic Number = 2^(32 - N)** for the 4th octet.
   Example: For /28 -> 32 - 28 = 4 -> 2^4 = **16 IPs per subnet**.
   Subnet blocks increment by 16: .0, .16, .32, .48, .64, .80, .96, ...

## AWS VPC 5 Reserved IPs per Subnet
In AWS, you CANNOT use 5 IP addresses per CIDR block:
- **.0**: Network Address
- **.1**: Reserved by AWS for VPC Router
- **.2**: Reserved by AWS for DNS (AmazonProvidedDNS)
- **.3**: Reserved by AWS for future use
- **.255**: Broadcast Address (AWS does not support broadcast, but reserves it)

### Usable IPs in AWS:
| CIDR Prefix | Total IPs | AWS Usable IPs | Common Use Case |
|:---|:---|:---|:---|
| **/16** | 65,536 | 65,531 | Typical VPC Root Range (e.g., 10.0.0.0/16) |
| **/20** | 4,096 | 4,091 | Large EKS Worker Subnet (high pod density) |
| **/24** | 256 | 251 | Standard Application / Microservice Subnet |
| **/26** | 64 | 59 | Public Subnet for ALBs and NAT Gateways |
| **/28** | 16 | 11 | Isolated Database / Private Endpoints Subnet |

## EKS VPC CNI Secondary IP Formula
Max Pods per EC2 node = \`((ENIs - 1) * (IPv4 Addresses per ENI - 1)) + 2\`
Example for \`m5.large\` (3 ENIs, 10 IPs per ENI):
\`((3 - 1) * (10 - 1)) + 2 = (2 * 9) + 2 = 20 pods per node\`.
*To avoid IP exhaustion in EKS, enable prefix delegation or secondary VPC CIDR (100.64.0.0/10).*
`
  },
  terraform: {
    id: "terraform",
    title: "Terraform Plan Review & Production State Cheatsheet",
    topic: "terraform",
    summary: "Preventing accidental resource destruction, diagnosing state locks, refactoring modules, and import workflows.",
    canonicalUrl: "https://blog.naveedkumbhar.com/how-to-review-terraform-plans-without-destroying-production/",
    content: `# Terraform Plan Review & Production State Cheatsheet

## Emergency State Lock Release
If a pipeline dies and DynamoDB keeps the lock:
\`\`\`bash
# 1. Grab Lock ID from error message
terraform force-unlock <LOCK-ID>
\`\`\`

## Spotting Forces-Replacement Traps in Plan
When reviewing \`terraform plan\` outputs, look for:
- \`~ update in-place\` -> Safe (modifies existing resource attributes).
- \`+ create\` -> Safe (new resource).
- \`- destroy\` -> Dangerous (deletes resource).
- \`- / + destroy and then create replacement\` -> **CRITICAL TRAP!** (Destroys database, RDS, EBS, or VPC before creating new one).

### Common Forces-Replacement Triggers:
- Changing RDS \`identifier\` or VPC subnet group.
- Changing AWS S3 bucket name.
- Changing KMS key alias or KMS key spec.
- Modifying IAM role name instead of tags/descriptions.

## Safe Refactoring with \`moved\` Blocks (Terraform 1.1+)
Never use manual \`state mv\` in team production. Write declarative moved blocks:
\`\`\`hcl
moved {
  from = aws_instance.web
  to   = module.compute.aws_instance.web[0]
}
\`\`\`

## Targeted Execution Safeguards
\`\`\`bash
# Run plan for single module
terraform plan -target=module.vpc

# Refresh state without applying changes
terraform apply -refresh-only
\`\`\`
`
  }
};
