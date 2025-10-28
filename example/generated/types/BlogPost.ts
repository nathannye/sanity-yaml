import Slice from '~/components/Slice'

interface BlogPostProps {
}

const BlogPost = ({}: BlogPostProps) => {
  return (
    <Slice>
      <div className="h-screen w-full border-8 flex justify-center items-center">
        <h2>Slice: BlogPost</h2>
      </div>
    </Slice>
  )
}

export default BlogPost