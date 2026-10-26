export type ErrorKind =
  | 'exit-code'
  | 'http'
  | 'kubernetes'
  | 'docker'
  | 'ecs'
  | 'aws'
  | 'terraform'
  | 'linux'
  | 'network'
  | 'tls';

export interface ErrorEntry {
  id: string;
  kind: ErrorKind;
  title: string;
  /** Numeric exit codes or HTTP status codes this entry explains. */
  codes?: number[];
  /** Lowercase substrings matched against the user's error text. */
  patterns?: string[];
  meaning: string;
  causes: string[];
  diagnose: string[];
  fix: string[];
  /** Query used to pull matching incident scenarios from the scenario index. */
  search: string;
}

export const ERRORS: ErrorEntry[] = [
  // ── Exit codes ──────────────────────────────────────────────────────────────
  {
    id: 'exit-code-137',
    kind: 'exit-code',
    title: 'Exit code 137: SIGKILL (128 + 9)',
    codes: [137],
    meaning: 'The process was killed with SIGKILL. SIGKILL cannot be caught, so the application gets no chance to clean up.',
    causes: [
      'Kernel OOM killer: the container exceeded its memory limit (the most common cause).',
      'Graceful shutdown timed out: docker stop (10s), ECS stopTimeout (30s) or Kubernetes terminationGracePeriodSeconds (30s) expired after SIGTERM, so SIGKILL followed. Typical when PID 1 is a shell that does not forward SIGTERM.',
      'Orchestrator stop: failed ECS/ELB health check, failed liveness probe, Spot interruption or scale-in.',
      'A manual docker kill or kill -9.',
      'Host memory pressure killing a container that was under its own limit.'
    ],
    diagnose: [
      "docker inspect --format '{{.State.OOMKilled}} {{.State.ExitCode}}' <container>",
      "dmesg -T | grep -i -E 'oom|killed process'",
      "kubectl describe pod <pod> | grep -B2 -A8 'Last State'",
      "aws ecs describe-tasks --cluster <cluster> --tasks <task-id> --query 'tasks[0].{stopCode:stopCode,stoppedReason:stoppedReason,containers:containers[].{name:name,reason:reason}}'"
    ],
    fix: [
      'If OOMKilled is true: profile memory first, then raise the limit. Size JVM and Node.js heaps below the container limit (for example -XX:MaxRAMPercentage=70).',
      'If it is a SIGTERM timeout: use exec-form ENTRYPOINT, `exec` in wrapper scripts or `--init`, handle SIGTERM in the app, and tune the stop timeout.',
      'If it is a health-check stop: fix start-up time (grace period) or the health endpoint, not memory.'
    ],
    search: 'exit code 137'
  },
  {
    id: 'exit-code-1',
    kind: 'exit-code',
    title: 'Exit code 1: general application error',
    codes: [1],
    meaning: 'The process exited with a generic failure. The application, or a command in the entrypoint script, returned an error.',
    causes: [
      'Unhandled exception or crash during start-up.',
      'Missing or invalid configuration, environment variable or secret.',
      'A failing command in an entrypoint script running with `set -e`.',
      'A dependency (database, queue, API) that is unreachable at start-up.'
    ],
    diagnose: [
      'docker logs --tail 100 <container>',
      'kubectl logs <pod> --previous',
      'docker run --rm -it --entrypoint sh <image>'
    ],
    fix: [
      'Read the last log lines before the exit; the code itself carries no detail.',
      'Validate configuration at start-up and fail with a specific message.',
      'Add retries with backoff for dependencies instead of exiting immediately.'
    ],
    search: 'container exits with code 1 crash on startup'
  },
  {
    id: 'exit-code-2',
    kind: 'exit-code',
    title: 'Exit code 2: misuse or invalid arguments',
    codes: [2],
    meaning: 'Shells use 2 for builtin misuse or syntax errors, and many CLIs use it for usage errors such as invalid flags.',
    causes: [
      'Wrong or missing CLI flags or arguments.',
      'Syntax error in a shell script.',
      'A command or script run with the wrong interpreter.'
    ],
    diagnose: ['bash -n script.sh', '<command> --help', 'docker logs --tail 50 <container>'],
    fix: ['Fix the arguments or script syntax shown in the output.', 'Check the Dockerfile CMD and ENTRYPOINT for quoting mistakes.'],
    search: 'container command arguments error'
  },
  {
    id: 'exit-code-125',
    kind: 'exit-code',
    title: 'Exit code 125: docker run itself failed',
    codes: [125],
    meaning: 'The Docker daemon returned an error while creating or starting the container, so the application never ran.',
    causes: [
      'Invalid docker run flag or bad option value.',
      'Port already allocated or an invalid volume mount.',
      'Daemon-side error such as a storage driver or runtime failure.'
    ],
    diagnose: ['Re-run the docker run command and read stderr.', 'journalctl -u docker --since "10 min ago"', 'docker info'],
    fix: ['Correct the flag, port or mount named in the error.', 'Restart the Docker daemon only if the daemon logs show a runtime fault.'],
    search: 'docker run error exit 125'
  },
  {
    id: 'exit-code-126',
    kind: 'exit-code',
    title: 'Exit code 126: command found but not executable',
    codes: [126],
    meaning: 'The shell found the command but could not execute it.',
    causes: [
      'Missing execute permission on the entrypoint or binary.',
      'The file sits on a volume mounted with noexec.',
      'Wrong CPU architecture or the path is a directory.'
    ],
    diagnose: ['docker run --rm --entrypoint ls <image> -l /app/entrypoint.sh', 'file <binary>', 'mount | grep noexec'],
    fix: ['Set the execute bit: COPY --chmod=0755 or RUN chmod +x.', 'Avoid noexec mounts for executables.', 'Build for the right architecture.'],
    search: 'permission denied entrypoint not executable'
  },
  {
    id: 'exit-code-127',
    kind: 'exit-code',
    title: 'Exit code 127: command not found',
    codes: [127],
    meaning: 'The shell could not find the command or interpreter it was asked to run.',
    causes: [
      'The binary is missing from the image or not on PATH (for example it was not copied in a multi-stage build).',
      'The script shebang points to a missing interpreter, such as #!/bin/bash on Alpine.',
      'Windows CRLF line endings, which make the interpreter name end in a carriage return.',
      'A glibc binary run on Alpine (musl), which also reports "not found".'
    ],
    diagnose: [
      "docker run --rm --entrypoint sh <image> -c 'command -v <cmd>; echo $PATH'",
      'head -1 script.sh | od -c',
      'ldd <binary>'
    ],
    fix: ['Install or COPY the missing binary and check PATH.', 'Convert scripts to LF endings.', 'Use a matching base image (glibc vs musl).'],
    search: 'command not found exit 127 container'
  },
  {
    id: 'exit-code-130',
    kind: 'exit-code',
    title: 'Exit code 130: SIGINT (128 + 2)',
    codes: [130],
    meaning: 'The process was interrupted, usually by Ctrl+C or a cancelled CI job.',
    causes: ['Ctrl+C in an interactive docker run or terminal.', 'A CI job or pipeline was cancelled and sent SIGINT.'],
    diagnose: ['Check whether a person or a CI cancellation sent the signal.'],
    fix: ['Usually expected. Handle SIGINT in the app if cleanup is needed.'],
    search: 'SIGINT container interrupted'
  },
  {
    id: 'exit-code-134',
    kind: 'exit-code',
    title: 'Exit code 134: SIGABRT (128 + 6)',
    codes: [134],
    meaning: 'The process called abort(). The runtime or a native library hit a fatal condition.',
    causes: [
      'Node.js "Reached heap limit Allocation failed" aborts the process.',
      'glibc errors such as "double free or corruption" or a failed assertion.',
      'Fatal error inside a native extension or library.'
    ],
    diagnose: ['Read the log lines just before the exit (FATAL ERROR / assertion text).', 'node --max-old-space-size=<MB> app.js', 'Enable core dumps and inspect with gdb.'],
    fix: ['Right-size the heap or fix the leak.', 'Update or rebuild native dependencies.'],
    search: 'SIGABRT heap limit abort container'
  },
  {
    id: 'exit-code-139',
    kind: 'exit-code',
    title: 'Exit code 139: SIGSEGV (128 + 11)',
    codes: [139],
    meaning: 'The process accessed invalid memory (segmentation fault).',
    causes: [
      'Bug in native code or a C extension.',
      'Incompatible shared library or binary (musl vs glibc).',
      'amd64 image emulated on arm64 (or the reverse) under QEMU.',
      'Corrupted image layer or binary.'
    ],
    diagnose: ['dmesg -T | grep -i segfault', "docker image inspect --format '{{.Architecture}}' <image>", 'uname -m', 'Enable core dumps and inspect with gdb.'],
    fix: ['Use an image built for the host architecture.', 'Update the failing native library or rebuild the image.'],
    search: 'segmentation fault SIGSEGV container exit 139'
  },
  {
    id: 'exit-code-143',
    kind: 'exit-code',
    title: 'Exit code 143: SIGTERM (128 + 15)',
    codes: [143],
    meaning: 'A graceful stop was requested and the process exited on SIGTERM.',
    causes: [
      'Normal during docker stop, rolling deployments, scale-in and Kubernetes pod termination.',
      'Unexpected 143s usually mean an orchestrator or deploy tool stopped the container.'
    ],
    diagnose: ['kubectl get events --sort-by=.lastTimestamp', 'docker events --since 10m'],
    fix: [
      'Usually expected: treat 143 as a clean stop in health logic.',
      'If 143 is followed by 137, shutdown is too slow: forward SIGTERM and shorten cleanup.'
    ],
    search: 'SIGTERM graceful shutdown container 143'
  },
  {
    id: 'exit-code-255',
    kind: 'exit-code',
    title: 'Exit code 255: out of range or unspecified',
    codes: [255],
    meaning: 'Exit status outside the normal range or an unspecified error. Often seen with ssh and some runtimes.',
    causes: ['A script ran `exit -1`.', 'ssh could not connect or the remote session failed.', 'Ansible or a deploy tool could not reach the host.'],
    diagnose: ['ssh -vvv <host>', 'grep -n "exit" script.sh'],
    fix: ['Fix the connection (keys, security group, host) or the exit statements in the script.'],
    search: 'ssh connection exit code 255'
  },

  // ── Kubernetes ──────────────────────────────────────────────────────────────
  {
    id: 'k8s-oomkilled',
    kind: 'kubernetes',
    title: 'Kubernetes OOMKilled',
    patterns: ['oomkilled'],
    meaning: 'A container exceeded its memory limit and the kernel OOM killer terminated it. The exit code is 137.',
    causes: [
      'Memory limit set below the real working set.',
      'Memory leak or unbounded cache.',
      'JVM or Node.js heap larger than the container limit.',
      'emptyDir with medium: Memory counting against the limit.'
    ],
    diagnose: [
      "kubectl describe pod <pod> | grep -B2 -A8 'Last State'",
      'kubectl top pod <pod> --containers',
      "kubectl get pod <pod> -o jsonpath='{.status.containerStatuses[*].lastState.terminated}'"
    ],
    fix: [
      'Set limits from observed p99 usage plus headroom.',
      'Use container-aware heap flags (-XX:MaxRAMPercentage).',
      'Run the VPA in recommendation mode to size requests and limits.'
    ],
    search: 'OOMKilled kubernetes memory limit'
  },
  {
    id: 'k8s-crashloopbackoff',
    kind: 'kubernetes',
    title: 'Kubernetes CrashLoopBackOff',
    patterns: ['crashloopbackoff', 'back-off restarting failed container'],
    meaning: 'The container keeps exiting and the kubelet is delaying each restart with exponential backoff (up to 5 minutes).',
    causes: [
      'The app crashes on start (check the exit code).',
      'OOMKilled (exit 137).',
      'A failing liveness probe restarting a healthy but slow app.',
      'Missing config or secret, or wrong command or args.'
    ],
    diagnose: ['kubectl logs <pod> --previous', 'kubectl describe pod <pod>', 'kubectl get events --sort-by=.lastTimestamp'],
    fix: ['Act on the exit code in Last State.', 'Add a startupProbe for slow starters.', 'Fix the config the logs complain about.'],
    search: 'CrashLoopBackOff kubernetes'
  },
  {
    id: 'k8s-imagepullbackoff',
    kind: 'kubernetes',
    title: 'Kubernetes ImagePullBackOff / ErrImagePull',
    patterns: ['imagepullbackoff', 'errimagepull', 'failed to pull image', 'manifest unknown'],
    meaning: 'The node cannot pull the container image and is retrying with backoff.',
    causes: [
      'Wrong image name or tag, or the tag does not exist.',
      'Private registry without a valid imagePullSecret (or ECR auth expired).',
      'Registry rate limit.',
      'Node has no network path to the registry.'
    ],
    diagnose: ['kubectl describe pod <pod>   # the Events message holds the real reason', 'docker pull <image>   # from the node', 'kubectl get secret -n <ns>'],
    fix: ['Correct the image reference.', 'Create and reference an imagePullSecret.', 'Use a pull-through cache or authenticate to avoid rate limits.'],
    search: 'ImagePullBackOff kubernetes image pull'
  },
  {
    id: 'k8s-failedscheduling',
    kind: 'kubernetes',
    title: 'Kubernetes Pending: FailedScheduling',
    patterns: ['failedscheduling', 'insufficient cpu', 'insufficient memory', 'unschedulable', 'nodes are available', 'untolerated taint'],
    meaning: 'The scheduler could not place the pod on any node, so it stays Pending.',
    causes: [
      'Not enough allocatable CPU or memory for the pod requests.',
      'Taints without matching tolerations.',
      'nodeSelector or affinity matches no node.',
      'PersistentVolumeClaim unbound or in another zone.',
      'Per-node pod or IP limit reached (for example EKS ENI limits).'
    ],
    diagnose: ['kubectl describe pod <pod> | tail -20', "kubectl describe nodes | grep -A8 'Allocated resources'", 'kubectl get pvc -n <ns>'],
    fix: ['Lower requests or add nodes (or let Cluster Autoscaler/Karpenter scale).', 'Add tolerations or fix selectors.', 'Fix the PVC or storage class.'],
    search: 'pod pending FailedScheduling insufficient'
  },
  {
    id: 'k8s-evicted',
    kind: 'kubernetes',
    title: 'Kubernetes pod Evicted',
    patterns: ['evicted', 'the node was low on resource', 'diskpressure', 'memorypressure', 'ephemeral-storage'],
    meaning: 'The kubelet removed the pod to relieve node memory, disk or ephemeral-storage pressure.',
    causes: [
      'Node under memory or disk pressure.',
      'Pod exceeded its ephemeral-storage limit.',
      'BestEffort and Burstable pods are evicted first.'
    ],
    diagnose: [
      'kubectl describe pod <pod>',
      'kubectl describe node <node> | grep -i -A5 Conditions',
      'df -h   # on the node'
    ],
    fix: [
      'Set requests and limits (Guaranteed or Burstable QoS).',
      'Limit ephemeral-storage and rotate logs.',
      'Add capacity. Clean up the leftovers: kubectl delete pod --field-selector=status.phase=Failed -A'
    ],
    search: 'pod evicted node disk pressure'
  },
  {
    id: 'k8s-createcontainerconfigerror',
    kind: 'kubernetes',
    title: 'Kubernetes CreateContainerConfigError',
    patterns: ['createcontainerconfigerror', "couldn't find key", 'runasnonroot and image will run as root'],
    meaning: 'The kubelet cannot build the container config, so the container never starts.',
    causes: [
      'A referenced ConfigMap, Secret or key does not exist (or is in another namespace).',
      'runAsNonRoot is set but the image runs as root.'
    ],
    diagnose: ['kubectl describe pod <pod>', 'kubectl get configmap,secret -n <ns>'],
    fix: ['Create the missing object or fix the key name.', 'Set a numeric runAsUser or use a non-root image.'],
    search: 'CreateContainerConfigError configmap secret missing'
  },
  {
    id: 'k8s-containercreating',
    kind: 'kubernetes',
    title: 'Kubernetes stuck in ContainerCreating',
    patterns: ['containercreating', 'failedcreatepodsandbox', 'failed to create pod sandbox', 'failedmount', 'unable to attach or mount volumes', 'multi-attach error'],
    meaning: 'The pod was scheduled but the sandbox, network or volumes could not be set up.',
    causes: [
      'CNI problem or IP exhaustion (for example the AWS VPC CNI).',
      'Volume attach or mount failure, or Multi-Attach on a ReadWriteOnce volume.',
      'Referenced Secret or ConfigMap volume missing.'
    ],
    diagnose: ['kubectl describe pod <pod>   # read Events', 'kubectl get pods -n kube-system -l k8s-app=aws-node', 'kubectl get volumeattachment'],
    fix: ['Fix the CNI or free IPs (prefix delegation, bigger subnets).', 'Detach the volume from the old node or use ReadWriteMany.', 'Create the missing Secret or ConfigMap.'],
    search: 'pod stuck ContainerCreating failed to create pod sandbox'
  },
  {
    id: 'k8s-terminating',
    kind: 'kubernetes',
    title: 'Kubernetes pod stuck Terminating',
    patterns: ['stuck terminating', 'stuck in terminating'],
    meaning: 'The pod has a deletion timestamp but cannot finish shutting down.',
    causes: [
      'A finalizer that nothing is removing.',
      'The node is NotReady or unreachable.',
      'The app ignores SIGTERM and waits for the grace period.',
      'A volume that will not detach.'
    ],
    diagnose: ["kubectl get pod <pod> -o jsonpath='{.metadata.finalizers}'", 'kubectl get node', 'kubectl describe pod <pod>'],
    fix: ['Find and fix what the finalizer waits for before removing it.', 'Last resort: kubectl delete pod <pod> --grace-period=0 --force (risky for stateful workloads).'],
    search: 'pod stuck terminating finalizer'
  },
  {
    id: 'k8s-nodenotready',
    kind: 'kubernetes',
    title: 'Kubernetes node NotReady',
    patterns: ['notready', 'node not ready', 'kubelet stopped posting node status'],
    meaning: 'The control plane has stopped receiving healthy status from the node.',
    causes: ['kubelet or container runtime down.', 'Node resource pressure.', 'Network partition or CNI failure.', 'The instance was terminated.'],
    diagnose: ['kubectl describe node <node> | grep -A10 Conditions', 'journalctl -u kubelet -n 100   # on the node', 'systemctl status containerd'],
    fix: ['Restart the failed component or replace the node.', 'Fix the pressure condition shown in Conditions.'],
    search: 'node NotReady kubelet'
  },
  {
    id: 'k8s-no-endpoints',
    kind: 'kubernetes',
    title: 'Kubernetes Service has no endpoints',
    patterns: ['no endpoints available', 'no endpoints'],
    meaning: 'The Service selects no Ready pods, so traffic has nowhere to go.',
    causes: ['Selector does not match pod labels.', 'Pods are not Ready (readiness probe failing).', 'Wrong namespace or targetPort.'],
    diagnose: ['kubectl get endpoints <svc>', 'kubectl get pods --show-labels', 'kubectl describe svc <svc>'],
    fix: ['Align the selector with the pod labels.', 'Fix the readiness probe or the targetPort.'],
    search: 'service no endpoints selector mismatch'
  },
  {
    id: 'k8s-probe-failed',
    kind: 'kubernetes',
    title: 'Kubernetes probe failed',
    patterns: ['readiness probe failed', 'liveness probe failed', 'startup probe failed'],
    meaning: 'A health probe failed. Failed readiness removes the pod from Services; failed liveness restarts the container.',
    causes: ['The app is slow to start.', 'Wrong probe path or port.', 'Timeout too tight under load.', 'Liveness probe checking an external dependency.'],
    diagnose: ['kubectl describe pod <pod>   # Events show the probe output', 'kubectl exec <pod> -- curl -sf localhost:<port>/health'],
    fix: ['Add a startupProbe for slow starts.', 'Keep dependency checks out of liveness.', 'Raise timeoutSeconds and failureThreshold sensibly.'],
    search: 'liveness readiness probe failed'
  },
  {
    id: 'k8s-rbac-forbidden',
    kind: 'kubernetes',
    title: 'Kubernetes RBAC: forbidden',
    patterns: ['is forbidden', 'forbidden: user', 'cannot list resource', 'cannot get resource'],
    meaning: 'The identity making the request is authenticated but not authorized for that action.',
    causes: ['Missing Role/ClusterRole or binding.', 'Pod running as the wrong ServiceAccount.', 'Binding created in a different namespace.'],
    diagnose: ['kubectl auth can-i <verb> <resource> --as=system:serviceaccount:<ns>:<sa> -n <ns>', 'kubectl get rolebinding,clusterrolebinding -A | grep <sa>'],
    fix: ['Grant the narrowest Role that covers the action.', 'Set the correct serviceAccountName on the pod.'],
    search: 'kubernetes RBAC forbidden serviceaccount'
  },

  // ── HTTP ────────────────────────────────────────────────────────────────────
  {
    id: 'http-502',
    kind: 'http',
    title: 'HTTP 502 Bad Gateway',
    codes: [502],
    patterns: ['bad gateway'],
    meaning: 'The proxy or load balancer got an invalid response, or none, from the upstream.',
    causes: [
      'The upstream crashed or was restarting (often during deployments without graceful shutdown).',
      'The upstream closed an idle keep-alive connection before the load balancer did.',
      'Wrong upstream port or protocol (HTTP vs HTTPS).'
    ],
    diagnose: [
      "kubectl logs -n ingress-nginx <controller-pod> | grep ' 502 '",
      'aws elbv2 describe-target-health --target-group-arn <arn>',
      'curl -v http://<upstream>:<port>/health'
    ],
    fix: [
      'Make the upstream keep-alive timeout longer than the load balancer idle timeout.',
      'Add graceful shutdown with a preStop sleep and readiness probes.',
      'Correct the port and protocol.'
    ],
    search: '502 bad gateway'
  },
  {
    id: 'http-503',
    kind: 'http',
    title: 'HTTP 503 Service Unavailable',
    codes: [503],
    patterns: ['service unavailable', 'no healthy upstream'],
    meaning: 'No backend is available to take the request, or the service is shedding load.',
    causes: ['No healthy targets or Service endpoints.', 'Backends overloaded or scaling up.', 'Rate limiting by the proxy.'],
    diagnose: ['aws elbv2 describe-target-health --target-group-arn <arn>', 'kubectl get endpoints <svc>', 'Check the proxy error log for "no healthy upstream".'],
    fix: ['Restore healthy targets (probes, security groups).', 'Scale out and add capacity before traffic spikes.'],
    search: '503 service unavailable'
  },
  {
    id: 'http-504',
    kind: 'http',
    title: 'HTTP 504 Gateway Timeout',
    codes: [504],
    patterns: ['gateway timeout', 'upstream request timeout'],
    meaning: 'The proxy waited for the upstream longer than its timeout.',
    causes: [
      'Upstream slower than the load balancer timeout (ALB idle timeout defaults to 60 seconds).',
      'Slow database or downstream dependency.',
      'Security group or network ACL silently dropping upstream traffic.'
    ],
    diagnose: ["curl -w '%{time_total}\\n' -o /dev/null -s <url>", 'Check TargetResponseTime in load balancer metrics.', 'nc -zv <upstream> <port>'],
    fix: ['Set timeouts consistently across the chain.', 'Fix the slow dependency or move long work to async jobs.'],
    search: '504 gateway timeout'
  },
  {
    id: 'http-499',
    kind: 'http',
    title: 'HTTP 499 Client Closed Request (nginx)',
    codes: [499],
    patterns: ['client closed request'],
    meaning: 'The client closed the connection before the server answered. nginx logs this as 499.',
    causes: ['Client or upstream proxy timeout shorter than the backend latency.', 'Users cancelling slow requests.'],
    diagnose: ['Compare request_time in the nginx log with the client timeout.', 'Check the upstream latency.'],
    fix: ['Reduce backend latency or align client and proxy timeouts.'],
    search: '499 client closed request nginx'
  },
  {
    id: 'http-429',
    kind: 'http',
    title: 'HTTP 429 Too Many Requests',
    codes: [429],
    patterns: ['too many requests', 'rate limit exceeded'],
    meaning: 'The caller exceeded a rate limit set by an API, ingress or WAF.',
    causes: ['Request bursts above the limit.', 'Retry storms without backoff.'],
    diagnose: ['Read the Retry-After response header.', 'Check the rate limit rules on the ingress, API gateway or WAF.'],
    fix: ['Retry with exponential backoff and jitter.', 'Cache responses or raise the limit if justified.'],
    search: 'rate limit 429 too many requests'
  },

  // ── Terraform / AWS / ECS ───────────────────────────────────────────────────
  {
    id: 'terraform-state-lock',
    kind: 'terraform',
    title: 'Terraform: Error acquiring the state lock',
    patterns: ['error acquiring the state lock', 'state lock', 'lockid'],
    meaning: 'Another Terraform run holds the state lock, or a crashed run left a stale lock.',
    causes: ['A CI or teammate run is still in progress.', 'A run was killed and never released the lock.'],
    diagnose: [
      'Read the Lock Info ID, Who and Created fields in the error.',
      'aws dynamodb get-item --table-name <lock-table> --key \'{"LockID":{"S":"<state-path>"}}\'',
      'Check CI for a running job.'
    ],
    fix: ['Wait for the running job to finish.', 'Only if the lock is confirmed stale: terraform force-unlock <LOCK_ID>.'],
    search: 'terraform state lock DynamoDB'
  },
  {
    id: 'aws-access-denied',
    kind: 'aws',
    title: 'AWS AccessDenied / not authorized',
    patterns: ['accessdenied', 'access denied', 'unauthorizedoperation', 'is not authorized to perform', 'explicit deny'],
    meaning: 'IAM or a resource policy blocked the call.',
    causes: [
      'Missing allow in the identity policy.',
      'An explicit deny from an SCP, permissions boundary or resource policy.',
      'Wrong role or account.',
      'KMS key policy or S3 bucket policy not granting access.'
    ],
    diagnose: [
      'aws sts get-caller-identity',
      'aws sts decode-authorization-message --encoded-message <message>',
      'Search CloudTrail for the denied event and read errorMessage.'
    ],
    fix: ['Add the narrowest allow needed.', 'Remove or adjust the explicit deny.', 'Check key and bucket policies as well as IAM.'],
    search: 'AWS AccessDenied IAM permission'
  },
  {
    id: 'aws-throttling',
    kind: 'aws',
    title: 'AWS ThrottlingException / Rate exceeded',
    patterns: ['throttlingexception', 'rate exceeded', 'requestlimitexceeded'],
    meaning: 'The account exceeded the API request rate for that service.',
    causes: ['Bursts of API calls from many nodes or jobs.', 'No retry with backoff in the client.'],
    diagnose: ['Check CloudTrail or service metrics for the call rate.', 'Identify the caller (role, tool or controller).'],
    fix: ['Use SDK retries with exponential backoff and jitter.', 'Cache results and request a quota increase if needed.'],
    search: 'AWS API throttling rate exceeded'
  },
  {
    id: 'ecs-cannotpullcontainererror',
    kind: 'ecs',
    title: 'ECS CannotPullContainerError',
    patterns: ['cannotpullcontainererror'],
    meaning: 'The task could not pull its image.',
    causes: [
      'Private subnet with no route to ECR (needs NAT or the ecr.api, ecr.dkr and S3 gateway endpoints).',
      'Task execution role lacks ECR permissions.',
      'Image or tag does not exist.',
      'Docker Hub rate limit.'
    ],
    diagnose: [
      "aws ecs describe-tasks --cluster <cluster> --tasks <task-id> --query 'tasks[0].stoppedReason'",
      'aws ecr describe-images --repository-name <repo> --image-ids imageTag=<tag>',
      'aws ec2 describe-vpc-endpoints'
    ],
    fix: ['Add the VPC endpoints or a NAT route.', 'Attach AmazonECSTaskExecutionRolePolicy to the execution role.', 'Fix the image reference.'],
    search: 'ECS CannotPullContainerError ECR'
  },
  {
    id: 'ecs-resourceinitializationerror',
    kind: 'ecs',
    title: 'ECS ResourceInitializationError',
    patterns: ['resourceinitializationerror', 'unable to pull secrets', 'failed to validate logger args'],
    meaning: 'ECS could not set up task resources such as secrets, logging or the network interface before starting the container.',
    causes: [
      'No route to Secrets Manager, SSM or CloudWatch Logs from the task subnet.',
      'Execution role missing secretsmanager:GetSecretValue, ssm:GetParameters or kms:Decrypt.',
      'The log group does not exist.'
    ],
    diagnose: ["aws ecs describe-tasks --cluster <cluster> --tasks <task-id> --query 'tasks[0].stoppedReason'", 'aws ec2 describe-vpc-endpoints'],
    fix: ['Add the interface endpoints or a NAT route.', 'Grant the execution role the missing permissions.', 'Create the log group.'],
    search: 'ECS ResourceInitializationError secrets'
  },
  {
    id: 'ecs-health-check',
    kind: 'ecs',
    title: 'ECS task failed ELB health checks',
    patterns: ['task failed elb health checks', 'failed container health checks'],
    meaning: 'The load balancer or container health check failed, so ECS stopped and replaced the task. The exit code is often 137 with no OOM message.',
    causes: ['Wrong health check port or path.', 'Security group does not allow the load balancer to reach the task.', 'Grace period shorter than the app start-up time.'],
    diagnose: ['aws elbv2 describe-target-health --target-group-arn <arn>', 'aws ecs describe-services --cluster <cluster> --services <service>'],
    fix: ['Correct the health check settings and security groups.', 'Raise healthCheckGracePeriodSeconds.'],
    search: 'ECS task failed ELB health checks unhealthy'
  },
  {
    id: 'ecs-oom',
    kind: 'ecs',
    title: 'ECS: Container killed due to memory usage',
    patterns: ['container killed due to memory usage', 'outofmemoryerror: container killed'],
    meaning: 'ECS reports that the container hit its memory limit and was OOM killed (exit code 137).',
    causes: ['Container hard limit (memory) too low.', 'App plus sidecars exceed the shared Fargate task memory.', 'Heap sized to the full limit.'],
    diagnose: [
      "aws ecs describe-tasks --cluster <cluster> --tasks <task-id> --query 'tasks[0].containers[].{name:name,reason:reason}'",
      'Graph MemoryUtilized in CloudWatch Container Insights.'
    ],
    fix: ['Raise task or container memory after checking usage.', 'Account for sidecars.', 'Use -XX:MaxRAMPercentage or --max-old-space-size below the limit.'],
    search: 'exit code 137 ECS OOM task memory'
  },

  // ── Docker / Linux ──────────────────────────────────────────────────────────
  {
    id: 'no-space-left-on-device',
    kind: 'docker',
    title: 'No space left on device',
    patterns: ['no space left on device', 'enospc'],
    meaning: 'The filesystem is out of blocks or inodes.',
    causes: ['Docker images, volumes or build cache filling /var/lib/docker.', 'Unbounded container json logs or journald.', 'Inode exhaustion from many small files.', 'inotify watch limit (shows the same message).'],
    diagnose: ['df -h', 'df -i', 'docker system df', 'du -xh /var/lib/docker --max-depth=1 | sort -h | tail'],
    fix: ['docker system prune (review what it removes first).', 'Set log rotation: max-size and max-file.', 'Grow the disk, or raise fs.inotify.max_user_watches for the inotify case.'],
    search: 'no space left on device disk full docker'
  },
  {
    id: 'port-already-allocated',
    kind: 'docker',
    title: 'Port is already allocated / address already in use',
    patterns: ['port is already allocated', 'address already in use'],
    meaning: 'Another process or container already listens on that host port.',
    causes: ['A previous container still holds the port.', 'A host service uses the same port.'],
    diagnose: ['ss -ltnp | grep :<port>', "docker ps --format '{{.Names}} {{.Ports}}'"],
    fix: ['Stop the process that owns the port or map a different host port.'],
    search: 'port already allocated docker'
  },
  {
    id: 'docker-socket-permission',
    kind: 'docker',
    title: 'Permission denied connecting to the Docker daemon socket',
    patterns: ['permission denied while trying to connect to the docker daemon socket', 'docker.sock'],
    meaning: 'The current user cannot access /var/run/docker.sock.',
    causes: ['User is not in the docker group.', 'Socket permissions changed, or a non-root CI user lacks access.'],
    diagnose: ['ls -l /var/run/docker.sock', 'id'],
    fix: [
      'Add the user to the docker group (this is root-equivalent access) or use sudo.',
      'Prefer rootless Docker or a remote builder in CI.'
    ],
    search: 'docker socket permission denied'
  },
  {
    id: 'exec-format-error',
    kind: 'docker',
    title: 'exec format error',
    patterns: ['exec format error'],
    meaning: 'The kernel cannot run the binary: usually a CPU architecture mismatch or a script with no shebang.',
    causes: ['arm64 image on amd64 hosts, or the reverse.', 'Shell script without a #! line.', 'Corrupted binary.'],
    diagnose: ["docker image inspect --format '{{.Architecture}}' <image>", 'uname -m', 'head -1 script.sh'],
    fix: ['Build multi-arch: docker buildx build --platform linux/amd64,linux/arm64.', 'Run with --platform to match the host.', 'Add the shebang.'],
    search: 'exec format error architecture mismatch docker'
  },
  {
    id: 'registry-denied-rate-limit',
    kind: 'docker',
    title: 'Registry: denied or Docker Hub rate limit',
    patterns: ['toomanyrequests', 'pull rate limit', 'denied: requested access to the resource is denied', 'pull access denied'],
    meaning: 'The registry refused the pull: wrong repository, no login, or anonymous rate limits reached.',
    causes: ['Image name wrong or private and not logged in.', 'Anonymous Docker Hub pulls over the limit (common on shared NAT or CI).'],
    diagnose: ['docker login <registry>', 'docker pull <image>', 'Check that the repository name and tag exist.'],
    fix: ['Authenticate pulls.', 'Mirror base images or use a pull-through cache (for example ECR).'],
    search: 'docker hub rate limit pull access denied'
  },
  {
    id: 'too-many-open-files',
    kind: 'linux',
    title: 'Too many open files',
    patterns: ['too many open files', 'emfile'],
    meaning: 'The process hit its file descriptor limit.',
    causes: ['Low ulimit -n.', 'File descriptor or socket leak.', 'High connection counts on a busy proxy or database.'],
    diagnose: ['ulimit -n', 'ls /proc/<pid>/fd | wc -l', 'cat /proc/sys/fs/file-max'],
    fix: ['Raise the limit (docker run --ulimit nofile=65536:65536, systemd LimitNOFILE).', 'Fix the leak and close connections.'],
    search: 'too many open files ulimit'
  },
  {
    id: 'linux-oom-killer',
    kind: 'linux',
    title: 'Linux OOM killer (Out of memory: Killed process)',
    patterns: ['out of memory: killed process', 'invoked oom-killer', 'oom-killer', 'memory cgroup out of memory'],
    meaning: 'The kernel ran out of memory (host-wide or inside a cgroup) and killed a process.',
    causes: ['Process or container over its cgroup memory limit.', 'Host overcommitted with too many workloads.', 'No swap and a memory spike.'],
    diagnose: ['dmesg -T | grep -i -E "out of memory|killed process"', 'journalctl -k | grep -i oom', 'free -m'],
    fix: ['Set memory limits so one workload cannot starve the host.', 'Right-size the offender or the instance.'],
    search: 'oom killer out of memory linux'
  },

  // ── TLS / DNS / network ─────────────────────────────────────────────────────
  {
    id: 'tls-x509',
    kind: 'tls',
    title: 'TLS: x509 / certificate verify failed',
    patterns: ['x509: certificate', 'certificate signed by unknown authority', 'certificate has expired', 'certificate verify failed', 'ssl certificate problem'],
    meaning: 'The client does not trust the server certificate, or the certificate is invalid.',
    causes: [
      'Expired certificate.',
      'Missing intermediate certificate on the server.',
      'Corporate proxy CA not in the trust store, or a slim image without ca-certificates.',
      'Wrong system clock or a hostname not in the SAN list.'
    ],
    diagnose: [
      'openssl s_client -connect <host>:443 -servername <host> </dev/null | openssl x509 -noout -dates -subject -issuer',
      'date -u',
      'docker run --rm <image> ls /etc/ssl/certs | head'
    ],
    fix: ['Renew or fix the chain.', 'Install ca-certificates and add the corporate CA.', 'Fix clock sync (NTP).'],
    search: 'x509 certificate signed by unknown authority tls'
  },
  {
    id: 'dns-resolution',
    kind: 'network',
    title: 'DNS: no such host / name resolution failure',
    patterns: ['no such host', 'temporary failure in name resolution', 'nxdomain', 'could not resolve host', 'server misbehaving'],
    meaning: 'The name could not be resolved.',
    causes: [
      'CoreDNS down or overloaded.',
      'ndots and search path causing slow or failing lookups.',
      'Wrong resolv.conf, or VPC DNS support disabled.',
      'Security group or firewall blocking UDP/TCP 53.'
    ],
    diagnose: [
      'kubectl run -it --rm dnsutils --image=registry.k8s.io/e2e-test-images/jessie-dnsutils:1.3 -- nslookup kubernetes.default',
      'kubectl logs -n kube-system -l k8s-app=kube-dns',
      'kubectl exec <pod> -- cat /etc/resolv.conf'
    ],
    fix: ['Restore or scale CoreDNS (NodeLocal DNSCache helps).', 'Use fully qualified names (trailing dot) or lower ndots.', 'Open port 53.'],
    search: 'DNS resolution failing kubernetes coredns'
  },
  {
    id: 'connection-refused-timeout',
    kind: 'network',
    title: 'Connection refused / connection timed out',
    patterns: ['connection refused', 'econnrefused', 'connection timed out', 'i/o timeout', 'etimedout'],
    meaning: 'Refused means the host answered but nothing is listening on that port. A timeout means packets are being dropped or never answered.',
    causes: [
      'Refused: service down, wrong port, or the app binds 127.0.0.1 instead of 0.0.0.0.',
      'Timeout: security group, network ACL, firewall, missing route or a Kubernetes NetworkPolicy.'
    ],
    diagnose: ['ss -ltnp   # on the target', 'nc -zv <host> <port>', 'curl -v http://<host>:<port>', 'kubectl get networkpolicy -n <ns>'],
    fix: ['Bind to 0.0.0.0 and use the right port.', 'Open the security group, ACL or NetworkPolicy path.'],
    search: 'connection refused timed out security group'
  }
];
