import { useEffect, useState } from 'react'

import ProtonDBTier from '../../types/ProtonDBTier'
import { getLinuxInfo, getProtonDBInfo } from '../actions/protondb'
import { getCache, updateCache } from '../cache/protobDbCache'
import { isOutdated } from '../lib/time'

const useBadgeData = (appId: string | undefined) => {
  const [protonDBTier, setProtonDBTier] = useState<ProtonDBTier>()
  const [linuxSupport, setLinuxSupport] = useState<boolean>(false)

  async function refresh() {
    const tierPromise = getProtonDBInfo(appId as string)
    const linuxPromise = getLinuxInfo(appId as string)
    const [tier, linuxSupport] = await Promise.all([tierPromise, linuxPromise])
    if (tier?.length && appId?.length) {
      updateCache(appId, {
        tier: tier,
        linuxSupport,
        lastUpdated: new Date().toISOString()
      })
      setProtonDBTier(tier)
    }
    setLinuxSupport(linuxSupport)
  }

  useEffect(() => {
    // Proton DB Data
    let ignore = false
    async function getData() {
      const cache = await getCache(appId as string)
      if (cache?.tier) {
        setProtonDBTier(cache.tier)
        if (!isOutdated(cache?.lastUpdated)) return
      }
      const tier = await getProtonDBInfo(appId as string)
      if (ignore) {
        return
      }
      if (!tier?.length) return
      setProtonDBTier(tier)
    }
    if (appId?.length) {
      getData()
    }
    return () => {
      ignore = true
    }
  }, [appId])

  useEffect(() => {
    // Linux Data
    let ignore = false
    async function getData() {
      const cache = await getCache(appId as string)
      if (typeof cache?.linuxSupport !== 'undefined') {
        setLinuxSupport(cache?.linuxSupport)
        if (!isOutdated(cache?.lastUpdated)) return
      }
      const linuxSupport = await getLinuxInfo(appId as string)
      if (ignore) {
        return
      }
      setLinuxSupport(linuxSupport)
    }

    if (appId?.length) {
      getData()
    }
    return () => {
      ignore = true
    }
  }, [appId])

  useEffect(() => {
    if (protonDBTier) {
      updateCache(appId as string, {
        tier: protonDBTier,
        linuxSupport,
        lastUpdated: new Date().toISOString()
      })
    }
  }, [protonDBTier, linuxSupport])

  return {
    protonDBTier,
    linuxSupport,
    refresh
  }
}

export default useBadgeData
