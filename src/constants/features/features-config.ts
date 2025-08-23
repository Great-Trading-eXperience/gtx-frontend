import featuresConfigData from "@/constants/features/features-config.json";

interface FeatureFlags {
    ENABLED_TABS_MARKETS: boolean;
    ENABLED_TABS_SWAP: boolean;
    ENABLED_TABS_SPOT: boolean;
    ENABLED_TABS_CREATE: boolean;
    ENABLED_TABS_FAUCET: boolean;
    COMING_SOON_PERPETUAL: boolean;
    LANDING_PAGE_RISE: boolean;
    LANDING_PAGE_PHAROS: boolean;
    ENABLED_TABS_EARN: boolean;
    ENABLED_TABS_VEGTX: boolean;
    ENABLED_TABS_PERPETUAL: boolean;
    CROSSCHAIN_DEPOSIT_ENABLED: boolean;
}

interface FeaturesConfig {
    USE_SUBGRAPH: boolean;
    FEATURE_FLAGS: FeatureFlags;
}

// Type assertion for the imported JSON
const typedFeaturesConfig = featuresConfigData as FeaturesConfig;

// Extract feature configurations with proper typing
export const USE_SUBGRAPH = typedFeaturesConfig.USE_SUBGRAPH;
export const FEATURE_FLAGS = typedFeaturesConfig.FEATURE_FLAGS;

// Helper function to check if a specific feature is enabled
export function isFeatureEnabled(featureName: keyof FeatureFlags): boolean {
    if (!(featureName in FEATURE_FLAGS)) {
        throw new Error(`Feature "${featureName}" not found in FEATURE_FLAGS configuration`);
    }
    
    return FEATURE_FLAGS[featureName];
}

// Helper function to check if a specific tab is enabled
export function isTabEnabled(tabName: string): boolean {
    const featureKey = `ENABLED_TABS_${tabName.toUpperCase()}` as keyof FeatureFlags;
    
    if (!(featureKey in FEATURE_FLAGS)) {
        return false; // Default to disabled if the tab doesn't exist in feature flags
    }
    
    return FEATURE_FLAGS[featureKey];
}

// Helper function to enable or disable a feature
export function setFeatureEnabled(featureName: keyof FeatureFlags, enabled: boolean): void {
    if (!(featureName in FEATURE_FLAGS)) {
        throw new Error(`Feature "${featureName}" not found in FEATURE_FLAGS configuration`);
    }
    
    FEATURE_FLAGS[featureName] = enabled;
}

// Helper function to get a list of all enabled features
export function getEnabledFeatures(): (keyof FeatureFlags)[] {
    return Object.entries(FEATURE_FLAGS)
        .filter(([_, enabled]) => enabled)
        .map(([feature]) => feature as keyof FeatureFlags);
}

// Helper function to get a list of all enabled tabs
export function getEnabledTabs(): string[] {
    const tabPrefix = 'ENABLED_TABS_';
    
    return Object.entries(FEATURE_FLAGS)
        .filter(([feature, enabled]) => feature.startsWith(tabPrefix) && enabled)
        .map(([feature]) => feature.replace(tabPrefix, '').toLowerCase());
}