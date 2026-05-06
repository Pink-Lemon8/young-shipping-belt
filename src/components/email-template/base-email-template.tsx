import React from 'react'

interface BaseEmailTemplateProps {
  children: React.ReactNode
  title: string
  patientName: string
}

export function BaseEmailTemplate({ children, title, patientName }: BaseEmailTemplateProps) {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#163300',
      padding: '32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '600px',
        backgroundColor: '#163300',
        borderRadius: '24px',
        padding: '32px'
      }}>
        <div style={{
          backgroundColor: '#9ae26c',
          borderRadius: '24px',
          padding: '32px'
        }}>
          <div style={{
            position: 'relative',
            display: 'flex',
            margin: "0 auto",
            marginBottom: '24px'
          }}  >
            <img src="https://www.medscanada.com/logo.png" alt="Meds Canada Logo" style={{ margin: "0 auto", width: '64px', height: '64px' }} />
          </div>
          <h1 style={{
            color: '#163300',
            fontSize: '24px',
            fontWeight: 'bold',
            marginBottom: '24px',
            textAlign: 'center'
          }}>{title}</h1>
          <p style={{
            color: '#163300',
            fontSize: '18px',
            marginBottom: '16px'
          }}>Dear {patientName},</p>
          <div style={{ color: '#163300' }}>{children}</div>
          <div style={{
            marginTop: '32px',
            paddingTop: '16px',
            borderTop: '1px solid #163300',
            textAlign: 'center',
            fontSize: '14px',
            color: '#163300'
          }}>
            <p>&copy; {new Date().getFullYear()} Meds Canada. All rights reserved.</p>
            {/* <p>123 Pharmacy Street, Toronto, ON M5V 2L7</p> */}
            <p>1-800-123-4567 | support@medscanada.com</p>
          </div>
        </div>
      </div>
    </div>
  )
}