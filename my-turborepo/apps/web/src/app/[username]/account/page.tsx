import { redirect } from 'next/navigation'

interface PageProps {
  params: {
    username: string
  }
}

export default function UsernameAccountPage({ params }: PageProps) {
  // Redirect to the main account page
  redirect('/account')
}
