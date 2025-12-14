import { redirect } from 'next/navigation'

interface PageProps {
  params: Promise<{
    username: string
    page: string[]
  }>
}

export default async function UsernamePage({ params }: PageProps) {
  const { page } = await params
  const path = page.join('/')

  // Redirect to the non-prefixed path
  redirect(`/${path}`)
}
