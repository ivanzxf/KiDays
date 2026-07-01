'use client';

import React, { useState } from 'react';
import { School } from '@/types';

interface SchoolFilterSectionProps {
  onFilterChange: (filters: any) => void;
}

export default function SchoolFilterSection({ onFilterChange }: SchoolFilterSectionProps) {
  const [filters, setFilters] = useState({
    type: 'all' as 'all' | 'kindergarten' | 'primary',
    district: 'all',
    gender: 'all' as 'all' | 'coed' | 'boys' | 'girls',
    schoolNet: 'all',
  });

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h2 className="text-xl font-bold text-academic-blue mb-6">學校信息篩選器</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">學校類型</label>
          <div className="flex space-x-4">
            {[
              { value: 'all', label: '全部' },
              { value: 'kindergarten', label: '幼稚園' },
              { value: 'primary', label: '小學' },
            ].map((option) => (
              <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value={option.value}
                  checked={filters.type === option.value}
                  onChange={() => handleFilterChange('type', option.value)}
                  className="accent-accent-blue"
                />
                <span className="text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">地區</label>
          <select
            value={filters.district}
            onChange={(e) => handleFilterChange('district', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue"
          >
            <option value="all">全部地區</option>
            <option value="港島區">港島區</option>
            <option value="九龍區">九龍區</option>
            <option value="新界區">新界區</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">性別</label>
          <div className="flex space-x-4">
            {[
              { value: 'all', label: '全部' },
              { value: 'coed', label: '男女校' },
              { value: 'boys', label: '男校' },
              { value: 'girls', label: '女校' },
            ].map((option) => (
              <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  value={option.value}
                  checked={filters.gender === option.value}
                  onChange={() => handleFilterChange('gender', option.value)}
                  className="accent-accent-blue"
                />
                <span className="text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">校網</label>
          <select
            value={filters.schoolNet}
            onChange={(e) => handleFilterChange('schoolNet', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue"
          >
            <option value="all">全部校網</option>
            <option value="11">11</option>
            <option value="41">41</option>
            <option value="91">91</option>
          </select>
        </div>
      </div>
    </div>
  );
}
