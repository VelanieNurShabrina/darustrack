import React, { createContext, useContext, useState, useEffect } from 'react'
import { semesterAPI } from '../utils/api'
import { toast } from 'react-toastify'

const SemesterContext = createContext()

export function useSemester() {
  return useContext(SemesterContext)
}

export function SemesterProvider({ children }) {
  const [semesters, setSemesters] = useState([])
  const [activeSemester, setActiveSemester] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchSemesters = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('SemesterContext: Starting to fetch semesters...')
      console.log('SemesterContext: Calling semesterAPI.getAll()...')
      
      const data = await semesterAPI.getAll()
      console.log('SemesterContext: API response received:', data)
      console.log('SemesterContext: Response structure:', {
        isArray: Array.isArray(data),
        length: Array.isArray(data) ? data.length : 'not an array',
        dataType: typeof data,
        hasData: data && (Array.isArray(data) ? data.length > 0 : Object.keys(data).length > 0)
      })
      
      if (Array.isArray(data)) {
        console.log('SemesterContext: Setting semesters state with data:', data)
        setSemesters(data)
        
        // Find the active semester if any
        const active = data.find(semester => semester.is_active)
        if (active) {
          console.log('SemesterContext: Active semester found:', active)
          console.log('SemesterContext: Setting activeSemester state')
          setActiveSemester(active)
        } else if (data.length > 0) {
          // If no active semester is found, use the most recent one
          console.log('SemesterContext: No active semester found, sorting by date to find most recent')
          const sorted = [...data].sort((a, b) => 
            new Date(b.created_at || b.createdAt) - new Date(a.created_at || a.createdAt)
          )
          console.log('SemesterContext: Using most recent semester:', sorted[0])
          setActiveSemester(sorted[0])
        } else {
          console.log('SemesterContext: No semesters data available')
        }
      } else {
        console.error('SemesterContext: Unexpected response format', data)
        setSemesters([])
        setActiveSemester(null)
        setError('Format respons tidak valid')
      }
    } catch (err) {
      console.error('SemesterContext: Error fetching semesters:', err)
      console.error('SemesterContext: Error details:', {
        name: err.name,
        message: err.message,
        stack: err.stack
      })
      setError('Gagal memuat data semester')
      toast.error('Gagal memuat data semester')
      setSemesters([])
      setActiveSemester(null)
    } finally {
      setLoading(false)
      console.log('SemesterContext: Semester fetch operation completed')
    }
  }

  // Fetch semesters on component mount
  useEffect(() => {
    console.log('SemesterContext: Component mounted, initiating semester fetch')
    fetchSemesters()
  }, [])

  const value = {
    semesters,
    activeSemester,
    loading,
    error,
    fetchSemesters
  }

  return (
    <SemesterContext.Provider value={value}>
      {children}
    </SemesterContext.Provider>
  )
} 