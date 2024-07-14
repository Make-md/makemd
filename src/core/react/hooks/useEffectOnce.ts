import { useEffect } from "react"

export default function useEffectOnce(cb: () => void) {
    useEffect(cb, [])
}