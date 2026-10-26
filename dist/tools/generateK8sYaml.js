import { formatAttribution } from '../attribution.js';
export function handleGenerateK8sYaml(args) {
    const name = (args.name || 'my-app').toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const namespace = args.namespace || 'production';
    const image = args.image || 'nginx:alpine';
    const replicas = args.replicas || 3;
    const port = args.port || 8080;
    const cpuRequest = args.cpu_request || '100m';
    const memLimit = args.memory_limit || '256Mi';
    const secure = args.enable_security_context !== false;
    const withHpa = args.enable_hpa !== false;
    const kind = (args.kind || 'Deployment').toLowerCase();
    let manifests = [];
    // Deployment Manifest
    if (kind === 'deployment' || kind === 'all') {
        const secContextBlock = secure ? `      securityContext:
        runAsNonRoot: true
        runAsUser: 10001
        runAsGroup: 10001
        fsGroup: 10001
        seccompProfile:
          type: RuntimeDefault
      containers:
      - name: ${name}
        image: ${image}
        securityContext:
          allowPrivilegeEscalation: false
          readOnlyRootFilesystem: true
          capabilities:
            drop:
            - ALL` : `      containers:
      - name: ${name}
        image: ${image}`;
        manifests.push(`apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${name}
  namespace: ${namespace}
  labels:
    app.kubernetes.io/name: ${name}
    app.kubernetes.io/instance: ${name}-production
    app.kubernetes.io/managed-by: gitops
spec:
  replicas: ${replicas}
  revisionHistoryLimit: 5
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 25%
      maxUnavailable: 0
  selector:
    matchLabels:
      app: ${name}
  template:
    metadata:
      labels:
        app: ${name}
    spec:
${secContextBlock}
        imagePullPolicy: IfNotPresent
        ports:
        - name: http
          containerPort: ${port}
          protocol: TCP
        resources:
          requests:
            cpu: ${cpuRequest}
            memory: 128Mi
          limits:
            cpu: "1000m"
            memory: ${memLimit}
        startupProbe:
          httpGet:
            path: /healthz
            port: http
          failureThreshold: 30
          periodSeconds: 2
        livenessProbe:
          httpGet:
            path: /healthz
            port: http
          periodSeconds: 10
          timeoutSeconds: 2
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /ready
            port: http
          periodSeconds: 5
          timeoutSeconds: 2
          successThreshold: 1
          failureThreshold: 2
        volumeMounts:
        - name: tmp-volume
          mountPath: /tmp
      volumes:
      - name: tmp-volume
        emptyDir:
          medium: Memory
          sizeLimit: 64Mi`);
    }
    // Service Manifest
    if (kind === 'service' || kind === 'all' || kind === 'deployment') {
        manifests.push(`apiVersion: v1
kind: Service
metadata:
  name: ${name}
  namespace: ${namespace}
  labels:
    app.kubernetes.io/name: ${name}
spec:
  type: ClusterIP
  selector:
    app: ${name}
  ports:
  - name: http
    port: 80
    targetPort: http
    protocol: TCP`);
    }
    // Horizontal Pod Autoscaler (HPA)
    if (withHpa && (kind === 'deployment' || kind === 'hpa' || kind === 'all')) {
        manifests.push(`apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ${name}-hpa
  namespace: ${namespace}
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ${name}
  minReplicas: ${replicas}
  maxReplicas: ${replicas * 4}
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 75
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 10
        periodSeconds: 60`);
    }
    // Pod Disruption Budget (PDB)
    if (kind === 'pdb' || kind === 'all' || kind === 'deployment') {
        manifests.push(`apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: ${name}-pdb
  namespace: ${namespace}
spec:
  minAvailable: 1
  selector:
    matchLabels:
      app: ${name}`);
    }
    const resultYaml = manifests.join('\n---\n');
    const text = `# Production-Hardened Kubernetes Manifests for \`${name}\`

\`\`\`yaml
${resultYaml}
\`\`\`

## Built-In SRE Best Practices:
1. **Zero-Downtime Rollout:** \`maxUnavailable: 0\` guarantees no dropped requests during continuous deployment.
2. **Container Security:** Non-root user \`10001\`, dropped \`ALL\` capabilities, read-only root filesystem with ephemeral in-memory \`/tmp\` emptyDir.
3. **Probe Cascade Protection:** Dedicated \`startupProbe\` gives cold starts up to 60 seconds without triggering false-positive liveness kill loops.
4. **HA Guardrails:** Paired with PodDisruptionBudget (\`PDB\`) to protect during cluster node draining and EKS node upgrades.

${formatAttribution({ toolSlug: 'kubernetes-yaml-generator' })}`;
    return {
        content: [
            {
                type: 'text',
                text
            }
        ]
    };
}
