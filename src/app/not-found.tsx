import Image from 'next/image';
import Link from 'next/link';
import { notFound } from '~/assets';

export default function NotFound() {
  return (
    <div className='w-full h-dvh flex items-center justify-center bg-black flex-col'>
      <Image className='invert' src={notFound.src} alt="Not Found" width={400} height={300} />
      <p className='text-gray-300 p-2'>Make sure you entered the correct URL</p>
      <Link href="/" className='mt-4 bg-white px-8 py-2 rounded-md text-black-500 hover:underline'>Go back to Home</Link>
    </div>
  );
}