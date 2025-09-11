import React from 'react';

const Footer: React.FC = () => (
		<footer className="bg-olive-900 bg-opacity-95 text-white py-10 px-4 mt-16">
			<div className="max-w-7xl mx-auto flex flex-col md:flex-row md:justify-between md:items-center gap-8">
				<div className="flex flex-col md:flex-row md:items-center gap-4 mb-6 md:mb-0 text-center md:text-left">
					<img src="/KMRL-logo.png" alt="KMRL Logo" className="w-16 h-16 object-contain mx-auto md:mx-0" />
					<div>
						<h3 className="text-xl font-bold mb-2">JLN Metro Station, 4th Floor</h3>
						<p className="text-lg font-semibold">Kaloor, Ernakulam - 682017</p>
					</div>
				</div>
				<div className="flex flex-col items-center md:items-end gap-2">
					<div className="flex items-center gap-2 mb-1">
						<img src="/call.svg" alt="Call" className="w-6 h-6" />
						<span className="text-lg font-semibold">0484-2846700</span>
					</div>
					<div className="flex items-center gap-2 mb-1">
						<img src="/call.svg" alt="Call" className="w-6 h-6" />
						<span className="text-lg font-semibold">1800 425 0355 <span className="text-xs font-normal ml-1">(Toll Free)</span></span>
					</div>
					<div className="flex items-center gap-2">
						<img src="/time.svg" alt="Time" className="w-6 h-6" />
						<span className="text-lg">09.30 am – 5.00 pm</span>
					</div>
				</div>
			</div>
			<div className="mt-8 text-center text-olive-200 text-sm">
				© {new Date().getFullYear()} Kochi Metro Rail Ltd. All rights reserved.
			</div>
		</footer>
);

export default Footer;
