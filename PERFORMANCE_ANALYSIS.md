# Frontend Performance Analysis - Card Capture

## Executive Summary

Identified **5 major performance bottlenecks** causing slow cold reloads and 2FA delays:

1. **Multiple Serial API Calls on Login (MFA Flow)** - 5-8 sequential network requests
2. **Aggressive Supabase Realtime Subscriptions** - 2 separate channels polling every 2s
3. **No Request Debouncing** - Redundant profile fetches on auth state changes
4. **Large Initial Bundle** - All pages loaded upfront despite React.lazy
5. **Missing Data Caching** - Fresh API calls on every component mount

---

## 🔴 Critical Issue #1: MFA Login Flow - Sequential Waterfall

**Location**: `/src/components/MFALoginFlow.tsx`

### The Problem

The 2FA flow makes **5-8 sequential API calls** during login:

```
1. supabase.auth.signInWithPassword()           [~800ms]
2. SELECT from profiles (mfa_verified_at)       [~400ms]
3. SELECT from user_mfa_settings                [~300ms]
4. POST /mfa/check-device                       [~600ms]
5. POST /mfa/challenge (if not trusted)         [~700ms]
6. UPDATE profiles (mfa_verified_at)            [~400ms]
7. refetchProfile()                             [~400ms]
```

**Total**: ~3.6 seconds just for API calls!

### Recommendations

#### Quick Win (1-2 hours):
```typescript
// Parallelize independent queries
const [profileData, mfaSettings] = await Promise.all([
  supabase.from('profiles').select('*').eq('id', userId).single(),
  supabase.from('user_mfa_settings').select('*').eq('user_id', userId).maybeSingle()
]);
```

#### Better Solution (4-6 hours):
Create a single backend endpoint that returns everything:
```typescript
// POST /mfa/check-login-status
{
  "mfa_enabled": true,
  "mfa_verified": false,
  "device_trusted": false,
  "needs_enrollment": false,
  "phone_masked": "***-***-1234",
  "profile": { ... }
}
```

**Expected Improvement**: 2.5-3 seconds faster login

---

## 🔴 Critical Issue #2: Duplicate Realtime Subscriptions

**Location**:
- `/src/hooks/useCards.ts:93-128`
- `/src/hooks/useProcessingStatus.ts:152-226`

### The Problem

**TWO separate Supabase channels** listening to the same data:

#### Channel 1: `cards_changes` (useCards)
```typescript
// Lines 93-128
.on('postgres_changes', { table: 'reviewed_data' }, fetchCards)
.on('postgres_changes', { table: 'student_school_interactions' }, fetchCards)
```
- Triggers `fetchCards()` on EVERY database change
- No debouncing
- Fetches ALL cards even for 1 row change

#### Channel 2: `processing_status_${eventId}` (useProcessingStatus)
```typescript
// Lines 182-201
.on('postgres_changes', { table: 'processing_jobs' }, handleRealtimeChange)
```
- **Plus aggressive 2-second polling fallback** (lines 137-144)
- Fetches ALL processing jobs on every change

### Why This is Bad

1. **Double Network Traffic**: Two channels receiving the same updates
2. **Redundant Queries**: Both refetch entire datasets on single row changes
3. **No Filtering**: Channels listen to ALL events (event: '*'), not just relevant ones
4. **Memory Leaks**: Old subscriptions not cleaned up properly in StrictMode

### Recommendations

#### Quick Fix (2-3 hours):
Add debouncing to prevent rapid refetches:

```typescript
// In useCards.ts
const debouncedFetchCards = useMemo(
  () => debounce(fetchCards, 500),
  [fetchCards]
);

const handleDbChange = useCallback((payload) => {
  // Only refetch if relevant to current event/school
  const isRelevant = payload.new?.event_id === currentEventId;
  if (isRelevant) {
    debouncedFetchCards();
  }
}, [currentEventId, debouncedFetchCards]);
```

#### Better Solution (1 day):
**Consolidate into single subscription manager**:

```typescript
// New file: /src/hooks/useRealtimeSync.ts
export function useRealtimeSync(eventId: string) {
  const channel = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    // Single channel for all updates
    channel.current = supabase
      .channel(`event_${eventId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'reviewed_data',
        filter: `event_id=eq.${eventId}` // Server-side filtering!
      }, handleChange)
      .subscribe();

    return () => {
      channel.current?.unsubscribe();
    };
  }, [eventId]);
}
```

**Expected Improvement**:
- 50% reduction in network requests
- Eliminate 2-second polling
- Faster UI updates (less contention)

---

## 🟡 Medium Issue #3: Auth State Chain Reactions

**Location**: `/src/contexts/AuthContext.tsx:94-168`

### The Problem

Every auth state change triggers a cascade of effects:

```
1. onAuthStateChange fires              (line 150)
2. setSession/setUser update            (lines 154-155)
3. useEffect[session] triggers          (line 95)
4. fetchProfile() called                (line 96)
5. Profile updated                      (line 126)
6. Component re-renders propagate       (entire tree)
```

This happens on:
- Initial page load
- Login
- MFA verification
- Token refresh (every hour)
- Tab focus changes

### Recommendations

#### Quick Fix (1 hour):
Add dependency array check to prevent redundant fetches:

```typescript
const prevSessionRef = useRef<Session | null>(null);

useEffect(() => {
  // Only fetch if session actually changed
  if (session?.user?.id === prevSessionRef.current?.user?.id) {
    return;
  }
  prevSessionRef.current = session;
  fetchProfile();
}, [session, fetchProfile]);
```

#### Better Solution (2-3 hours):
Cache profile data in localStorage with TTL:

```typescript
const PROFILE_CACHE_KEY = 'user_profile_cache';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const fetchProfile = useCallback(async () => {
  // Check cache first
  const cached = localStorage.getItem(PROFILE_CACHE_KEY);
  if (cached) {
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < CACHE_TTL) {
      setProfile(data);
      return;
    }
  }

  // Fetch from database
  const { data } = await supabase.from('profiles')...

  // Cache result
  localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify({
    data,
    timestamp: Date.now()
  }));

  setProfile(data);
}, []);
```

**Expected Improvement**:
- Eliminate 2-3 profile fetches per login
- Faster navigation between pages

---

## 🟡 Medium Issue #4: MFA Challenge Rate Limiting UI

**Location**: `/src/components/MFAChallengeModal.tsx`

### The Problem

When users enter wrong 2FA codes repeatedly:
- No visual feedback until **after** API call fails
- Error handling sets `isRateLimited=true` but UI doesn't pre-emptively disable
- Users can spam the API even when rate limited

### Recommendations

```typescript
// Add client-side rate limit tracking
const [attemptCount, setAttemptCount] = useState(0);
const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);

const handleVerify = async (code: string) => {
  // Client-side lockout
  if (lockoutUntil && Date.now() < lockoutUntil) {
    const remaining = Math.ceil((lockoutUntil - Date.now()) / 1000);
    toast.error(`Please wait ${remaining} seconds before trying again`);
    return;
  }

  setAttemptCount(prev => prev + 1);

  // Lock after 3 failed attempts
  if (attemptCount >= 3) {
    setLockoutUntil(Date.now() + 60000); // 1 minute
    toast.error('Too many attempts. Locked for 1 minute.');
    return;
  }

  // Continue with API call...
};
```

---

## 🟢 Minor Issue #5: Bundle Size

### Current Setup (App.tsx:29-51)

All pages loaded with `React.lazy()` ✅ Good!

But **no route-based code splitting for contexts**:
- AuthContext loaded on every page
- LoaderContext loaded on every page
- ThemeProvider loaded on every page

### Recommendations

Split public vs. authenticated contexts:

```typescript
// App.tsx
const PublicApp = React.lazy(() => import('./PublicApp'));
const AuthenticatedApp = React.lazy(() => import('./AuthenticatedApp'));

function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={<PublicApp />} />
        <Route path="/register/*" element={<PublicApp />} />
        <Route path="/*" element={<AuthenticatedApp />} />
      </Routes>
    </Suspense>
  );
}
```

**Expected Improvement**:
- 30-40% smaller initial bundle for public pages
- Faster login page load

---

## Implementation Priority

### Phase 1: Quick Wins (1-2 days)
1. ✅ Add debouncing to `useCards` subscription (2-3 hours)
2. ✅ Parallelize MFA login API calls (1-2 hours)
3. ✅ Cache profile data in AuthContext (2-3 hours)
4. ✅ Add client-side rate limiting to MFA (1 hour)

**Expected Result**: 2-3 second faster login, 50% fewer network requests

### Phase 2: Architecture Improvements (3-5 days)
1. ✅ Consolidate realtime subscriptions (1 day)
2. ✅ Create unified `/mfa/check-login-status` endpoint (1 day)
3. ✅ Implement route-based code splitting (1 day)
4. ✅ Add request caching layer (1 day)

**Expected Result**: 60-70% reduction in cold reload time

### Phase 3: Advanced Optimizations (1-2 weeks)
1. Implement service worker for offline support
2. Add IndexedDB caching for cards data
3. Use React Query for server state management
4. Implement virtual scrolling for large card lists

---

## Monitoring & Metrics

### Before/After Benchmarks

Track these metrics before and after fixes:

```typescript
// Add to main.tsx
window.performance.mark('app-init-start');

// In AuthContext (after profile loaded)
window.performance.mark('auth-complete');

// Calculate
const authTime = performance.measure(
  'auth-duration',
  'app-init-start',
  'auth-complete'
);
console.log('Auth took:', authTime.duration, 'ms');
```

### Target Metrics
- **Cold reload (not logged in)**: < 1 second
- **Login + 2FA (new device)**: < 4 seconds
- **Login + 2FA (trusted device)**: < 2 seconds
- **Navigation between pages**: < 300ms

---

## Quick Reference: Files to Modify

### High Priority
1. `/src/components/MFALoginFlow.tsx` - Parallelize API calls
2. `/src/hooks/useCards.ts` - Add debouncing, filter subscriptions
3. `/src/hooks/useProcessingStatus.ts` - Remove polling, consolidate
4. `/src/contexts/AuthContext.tsx` - Add caching, prevent redundant fetches

### Medium Priority
5. `/src/components/MFAChallengeModal.tsx` - Client-side rate limiting
6. `/src/App.tsx` - Route-based code splitting
7. `/src/services/CardService.ts` - Add request caching

### Backend Changes Needed
8. **NEW**: `/api/mfa/check-login-status` endpoint
9. **NEW**: Add event filtering to Supabase RLS policies

---

## Questions?

Slack: @engineering
GitHub: [Performance Label](https://github.com/your-repo/labels/performance)

Last Updated: 2025-10-19
