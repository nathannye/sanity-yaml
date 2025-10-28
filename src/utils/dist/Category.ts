import Slice from '~/components/Slice'

interface CategoryProps {
}

const Category = ({}: CategoryProps) => {
  return (
    <Slice>
      <div className="h-screen w-full border-8 flex justify-center items-center">
        <h2>Slice: Category</h2>
      </div>
    </Slice>
  )
}

export default Category