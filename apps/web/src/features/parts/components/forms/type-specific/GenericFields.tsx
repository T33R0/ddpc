import React from 'react'

export interface TypeFieldsProps {
  data: Record<string, any>
  onChange: (key: string, value: any) => void
}

export const GenericFields: React.FC<TypeFieldsProps> = () => {
  return null
}
