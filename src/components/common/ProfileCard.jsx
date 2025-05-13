import React from 'react'

function ProfileCard({ student }) {
  return (
    <div className="card mb-4">
      <div className="card-body">
        <h5 className="card-title text-primary mb-4">Profile</h5>
        <div className="mb-3">
          <div className="fw-bold">Nama: {student.name}</div>
          <div className="fw-bold">Tanggal Lahir: {student.birthDate}</div>
          <div className="fw-bold">Kelas: {student.class}</div>
          <div className="fw-bold mt-3">Wali Kelas: {student.homeRoomTeacher}</div>
        </div>
      </div>
    </div>
  )
}

export default ProfileCard
