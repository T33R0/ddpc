import { redirect } from 'next/navigation'

interface PageProps {
  params: {
    username: string
    page: string[]
  }
}

export default function UsernamePage({ params }: PageProps) {
  const { page } = params
  const path = page.join('/')

  // Redirect to the non-prefixed path
  redirect(`/${path}`)
}
