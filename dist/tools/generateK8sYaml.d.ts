export declare function handleGenerateK8sYaml(args: {
    kind?: string;
    name: string;
    namespace?: string;
    image: string;
    replicas?: number;
    port?: number;
    cpu_request?: string;
    memory_limit?: string;
    enable_security_context?: boolean;
    enable_hpa?: boolean;
}): {
    content: {
        type: string;
        text: string;
    }[];
};
