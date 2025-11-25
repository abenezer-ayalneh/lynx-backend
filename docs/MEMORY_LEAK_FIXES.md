# Memory Leak Fixes

This document outlines all the memory leak issues that were identified and fixed in the application.

## Issues Fixed

### 1. **MultiplayerRoom disposeTimeout Memory Leak** ✅
**Location:** `src/logic/scheduled-games/multiplayer.room.ts`

**Problem:** The `disposeTimeout` was being set multiple times without clearing the previous timeout, causing multiple timeouts to accumulate in memory.

**Fix:** 
- Added `clearTimeout()` before setting a new `disposeTimeout` in `inactivityTimeoutDisposal()` method
- Added `clearTimeout()` before setting a new `disposeTimeout` in `onLeave()` method
- Added cleanup in `onDispose()` method to clear the timeout when the room is disposed

### 2. **MultiplayerRoom Interval Memory Leaks** ✅
**Location:** `src/logic/scheduled-games/multiplayer.room.ts`

**Problem:** Intervals (`waitingCountdownInterval`, `gameTimeInterval`, `transitionTimeout`) were not being properly cleared in all scenarios, especially when restarting games or when rooms were disposed.

**Fix:**
- Added interval cleanup in `onDispose()` method
- Added interval cleanup in `restartGame()` method before restarting
- Added interval cleanup in `startRoundWithCountdown()` before creating new intervals
- Added interval cleanup in `stopCurrentRoundOrGame()` before creating new intervals

### 3. **SoloRoom Interval Memory Leaks** ✅
**Location:** `src/logic/scheduled-games/solo.room.ts`

**Problem:** Intervals (`waitingCountdownInterval`, `gameTimeInterval`) were not being properly cleared when `createCountdown()` was called multiple times or when the room was disposed.

**Fix:**
- Added interval cleanup in `createCountdown()` before creating a new interval
- Added interval cleanup in `stopCurrentRoundOrGame()` before creating a new interval
- Added `onDispose()` method to properly clean up all intervals when the room is disposed
- Added null checks before clearing intervals to prevent errors

### 4. **Colyseus Server Reference Missing** ✅
**Location:** `src/main.ts`, `src/logic/logic.service.ts`

**Problem:** The Colyseus server reference in `LogicService` was never set, preventing proper graceful shutdown and potentially causing memory leaks during application shutdown.

**Fix:**
- Set the Colyseus server reference in `main.ts` after creating the server
- This ensures proper graceful shutdown when the application receives shutdown signals

### 5. **Prisma Connection Pool Management** ✅
**Location:** `src/prisma/prisma.service.ts`

**Problem:** Prisma connections were not being properly closed on module destruction, potentially causing connection pool exhaustion.

**Fix:**
- Implemented `OnModuleDestroy` interface
- Added `onModuleDestroy()` method to properly disconnect Prisma client when the module is destroyed
- Added comments about connection pool configuration via DATABASE_URL

**Note:** Connection pool limits should be configured in the DATABASE_URL connection string:
```
DATABASE_URL="postgresql://user:password@host:port/database?connection_limit=10&pool_timeout=20"
```

### 6. **WebSocket Gateway Cleanup** ✅
**Location:** `src/websocket/websocket.gateway.ts`

**Problem:** While cleanup was happening, the disconnect handler could be improved for better memory management.

**Fix:**
- Implemented `OnGatewayDisconnect` interface
- Extracted disconnect logic into a separate `handleDisconnect()` method for better organization
- Ensured proper cleanup of `connectedPlayers` map on disconnect

## Additional Recommendations

### 1. **Monitor Memory Usage**
Consider adding memory monitoring to track memory usage over time:
```typescript
// Add to a scheduled task or health check endpoint
const used = process.memoryUsage();
console.log({
  rss: `${Math.round(used.rss / 1024 / 1024 * 100) / 100} MB`,
  heapTotal: `${Math.round(used.heapTotal / 1024 / 1024 * 100) / 100} MB`,
  heapUsed: `${Math.round(used.heapUsed / 1024 / 1024 * 100) / 100} MB`,
});
```

### 2. **Database Connection Pool Configuration**
Ensure your `DATABASE_URL` includes connection pool limits:
```
DATABASE_URL="postgresql://user:password@host:port/database?connection_limit=10&pool_timeout=20"
```

### 3. **PM2 Memory Limit**
Your `ecosystem.config.js` already has `max_memory_restart: '1G'` which is good. Consider monitoring if restarts are happening frequently.

### 4. **Redis Connection Management**
The Redis cache is managed by `@keyv/redis` and `cache-manager`, which should handle connection pooling automatically. Monitor Redis memory usage if issues persist.

### 5. **Colyseus Room Limits**
Consider adding room limits or monitoring active rooms to prevent unbounded growth:
```typescript
// In main.ts, after creating colyseusServer
colyseusServer.matchMaker.controller.maxRooms = 100; // Limit total rooms
```

## Testing Recommendations

1. **Load Testing:** Run load tests to verify memory usage remains stable under load
2. **Long-running Tests:** Run the application for extended periods and monitor memory usage
3. **Room Disposal:** Verify that rooms are properly disposed and memory is freed
4. **Connection Monitoring:** Monitor database and Redis connections to ensure they're not growing unbounded

## Monitoring Commands

```bash
# Monitor Node.js memory usage
node --expose-gc your-app.js

# Check PM2 memory usage
pm2 monit

# Check system memory
free -h

# Check process memory
ps aux | grep node
```

## Summary

All identified memory leaks have been fixed. The main issues were:
- Uncleared timeouts and intervals in game rooms
- Missing cleanup in room disposal
- Missing Prisma connection cleanup
- Missing Colyseus server reference for graceful shutdown

These fixes should significantly reduce memory usage and prevent the VPS from restarting due to memory spikes.

