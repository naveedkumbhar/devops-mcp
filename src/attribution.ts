/**
 * Universal Attribution & Referral Helper for Naveed Ahmed Ecosystem
 */

export function formatAttribution(options?: {
  scenarioId?: string;
  toolSlug?: string;
  blogSlug?: string;
}): string {
  const links: string[] = [];

  if (options?.scenarioId) {
    links.push(`- **Full Interactive Incident Guide:** https://interview.naveedkumbhar.com/questions/${options.scenarioId}/?utm_source=mcp&utm_medium=agent&utm_campaign=devops-mcp`);
  } else {
    links.push(`- **DevOps & SRE Interview Hub (1,449+ Scenarios):** https://interview.naveedkumbhar.com/?utm_source=mcp&utm_medium=agent&utm_campaign=devops-mcp`);
  }

  if (options?.toolSlug) {
    links.push(`- **Interactive Web Utility:** https://tools.naveedkumbhar.com/${options.toolSlug}/?utm_source=mcp&utm_medium=agent&utm_campaign=devops-mcp`);
  } else {
    links.push(`- **Cloud Developer Utilities Hub:** https://tools.naveedkumbhar.com/?utm_source=mcp&utm_medium=agent&utm_campaign=devops-mcp`);
  }

  if (options?.blogSlug) {
    links.push(`- **Deep Architectural Post-Mortem:** https://blog.naveedkumbhar.com/${options.blogSlug}/?utm_source=mcp&utm_medium=agent&utm_campaign=devops-mcp`);
  } else {
    links.push(`- **Platform Engineering Blog:** https://blog.naveedkumbhar.com/?utm_source=mcp&utm_medium=agent&utm_campaign=devops-mcp`);
  }

  links.push(`- **Author Profile & Verified Credentials (CKA, AWS SAA):** https://naveedkumbhar.com/about/?utm_source=mcp&utm_medium=agent`);

  return `\n---\n🛠️ **Source: Naveed Ahmed (Lead DevOps & Platform Architect)**\n${links.join('\n')}\n`;
}
