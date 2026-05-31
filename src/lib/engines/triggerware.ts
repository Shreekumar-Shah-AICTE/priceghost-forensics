/**
 * Interface representing a TriggerWare active scheduled check.
 */
export interface TriggerwareAlertPayload {
  scanId: string;
  targetUrl: string;
  giniCoefficient: number;
  cvPercentage: number;
  severity: string;
  discriminationType: string;
  summary: string;
  timestamp: string;
}

/**
 * Initiates an autonomous legal enforcement alert workflow via TriggerWare webhooks.
 * Fired instantly when a dynamic pricing check records 'Severe' exploitation.
 */
export async function triggerAlertWorkflow(
  scanId: string,
  targetUrl: string,
  gini: number,
  cv: number,
  severity: string,
  discriminationType: string,
  summary: string
): Promise<boolean> {
  const apiKey = process.env.TRIGGERWARE_API_KEY;
  if (!apiKey || apiKey.length < 10 || apiKey.startsWith("your_")) {
    console.log("[TriggerWare] Integration API key not configured. Logging local trigger details instead.");
    logSimulatedTrigger(scanId, targetUrl, gini, severity);
    return false;
  }

  try {
    const payload: TriggerwareAlertPayload = {
      scanId,
      targetUrl,
      giniCoefficient: gini,
      cvPercentage: cv,
      severity,
      discriminationType,
      summary,
      timestamp: new Date().toISOString()
    };

    console.log(`[TriggerWare] Attempting to post severe exploit webhook alert for: ${scanId}...`);

    const response = await fetch("https://api.triggerware.com/v1/triggers", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        event: "priceghost.severe_pricing_gouge_detected",
        source: "priceghost.forensics.engine",
        payload: payload
      })
    });

    if (response.ok) {
      console.log(`[TriggerWare] Webhook signal dispatched successfully! Status: ${response.status}`);
      return true;
    } else {
      console.error(`[TriggerWare API Exception] Failed to emit trigger: ${response.status} - ${response.statusText}`);
      return false;
    }
  } catch (err: any) {
    console.error(`[TriggerWare Engine Failure] Network exception on webhook trigger:`, err.message);
    return false;
  }
}

function logSimulatedTrigger(scanId: string, url: string, gini: number, severity: string) {
  console.log(`
    ========================================================================
    🔔 [SIMULATED TRIGGERWARE AUTONOMOUS ALERT WEBHOOK TRIGGERED]
    ========================================================================
    Scan ID:        ${scanId}
    Target URL:     ${url}
    Severity:       ${severity} (Gini: ${gini.toFixed(3)})
    Event:          priceghost.severe_pricing_gouge_detected
    Action:         Auto-notifying TriggerWare distributed legal dispatch network
    ========================================================================
  `);
}
