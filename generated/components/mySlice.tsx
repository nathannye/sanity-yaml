import Slice from "~/components/Slice";

interface MySliceProps {
	stuff: {
		you: string;
		them: string;
		listItems: {
			name: string;
			other: number;
		}[];
	};
	title: string;
	date: string;
	itemsWithOptions: string[];
	items: "op1" | "op2" | "op3";
	ref: any;
	docs: any[];
	description: string;
	refArr: reference[];
	contact: string;
	count: number;
	itemList: string;
	points: { lat: number; lng: number; alt: number };
}

const MySlice = ({
	stuff,
	title,
	date,
	itemsWithOptions,
	items,
	ref,
	docs,
	description,
	refArr,
	contact,
	count,
	itemList,
	points,
}: MySliceProps) => {
	return (
		<Slice>
			<div className="h-screen w-full border-8 flex justify-center items-center">
				<h2>Slice: mySlice</h2>
			</div>
		</Slice>
	);
};

export default MySlice;
