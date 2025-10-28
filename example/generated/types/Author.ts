import Slice from '~/components/Slice'

interface AuthorProps {
}

const Author = ({}: AuthorProps) => {
  return (
    <Slice>
      <div className="h-screen w-full border-8 flex justify-center items-center">
        <h2>Slice: Author</h2>
      </div>
    </Slice>
  )
}

export default Author