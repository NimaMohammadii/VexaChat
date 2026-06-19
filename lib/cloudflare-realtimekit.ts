type CloudflareRealtimeResponse<T> = {
  success?: boolean;
  data?: T;
  result?: T;
  errors?: Array<{ message?: string }>;
};

type RealtimeKitMeeting = {
  id: string;
  title?: string;
  created_at?: string;
  updated_at?: string;
};

type RealtimeKitParticipant = {
  id: string;
  token: string;
  custom_participant_id: string;
  name?: string;
};

const API_BASE = "https://api.cloudflare.com/client/v4";
const DEFAULT_PRESET_NAME = "group_call_participant";

function getRealtimeKitConfig() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const appId = process.env.CLOUDFLARE_REALTIMEKIT_APP_ID;
  const apiToken = process.env.CLOUDFLARE_REALTIMEKIT_API_TOKEN;
  const presetName = process.env.CLOUDFLARE_REALTIMEKIT_PRESET_NAME || DEFAULT_PRESET_NAME;

  if (!accountId || !appId || !apiToken) {
    throw new Error("Cloudflare RealtimeKit is not configured.");
  }

  return { accountId, appId, apiToken, presetName };
}

async function realtimeKitFetch<T>(path: string, init: RequestInit = {}) {
  const { accountId, appId, apiToken } = getRealtimeKitConfig();
  const response = await fetch(`${API_BASE}/accounts/${accountId}/realtime/kit/${appId}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiToken}`,
      ...(init.headers ?? {})
    },
    cache: "no-store"
  });

  const payload = (await response.json().catch(() => ({}))) as CloudflareRealtimeResponse<T>;

  if (!response.ok || payload.success === false) {
    const message = payload.errors?.map((error) => error.message).filter(Boolean).join("; ") || `Cloudflare RealtimeKit request failed: ${response.status}`;
    throw new Error(message);
  }

  const body = payload.data ?? payload.result;

  if (!body) {
    throw new Error("Cloudflare RealtimeKit returned an empty response.");
  }

  return body;
}

export async function createRealtimeKitMeeting(title: string) {
  return realtimeKitFetch<RealtimeKitMeeting>("/meetings", {
    method: "POST",
    body: JSON.stringify({
      title,
      persist_chat: false,
      record_on_start: false,
      live_stream_on_start: false,
      session_keep_alive_time_in_secs: 30
    })
  });
}

export async function addRealtimeKitParticipant({
  meetingId,
  customParticipantId,
  name,
  picture
}: {
  meetingId: string;
  customParticipantId: string;
  name: string;
  picture?: string;
}) {
  const { presetName } = getRealtimeKitConfig();

  return realtimeKitFetch<RealtimeKitParticipant>(`/meetings/${meetingId}/participants`, {
    method: "POST",
    body: JSON.stringify({
      custom_participant_id: customParticipantId,
      preset_name: presetName,
      name,
      ...(picture ? { picture } : {})
    })
  });
}
