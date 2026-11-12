import { Link } from 'react-router-dom'
import PageHeader from '../components/layout/PageHeader'

export default function NotFoundPage() {
  return (
    <>
      <PageHeader title="Page not found" />
      <div className="card px-6 py-14 text-center">
        <p className="text-sm text-zinc-400">The page you are looking for does not exist.</p>
        <Link to="/" className="btn-primary mt-4">Back to overview</Link>
      </div>
    </>
  )
}
